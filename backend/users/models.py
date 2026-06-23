import uuid

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class School(models.Model):
    school_name = models.CharField(max_length=160)
    school_code = models.CharField(max_length=20, unique=True)

    class Meta:
        ordering = ["school_name"]

    def __str__(self):
        return f"{self.school_name} ({self.school_code})"


class Program(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name="programs")
    program_name = models.CharField(max_length=180)
    program_code = models.CharField(max_length=40)

    class Meta:
        ordering = ["program_name"]
        constraints = [
            models.UniqueConstraint(
                fields=["school", "program_code"],
                name="unique_program_code_per_school",
            )
        ]

    def __str__(self):
        return f"{self.program_name} ({self.program_code})"


class Branch(models.Model):
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name="branches")
    branch_name = models.CharField(max_length=180)
    branch_code = models.CharField(max_length=40)

    class Meta:
        ordering = ["branch_name"]
        constraints = [
            models.UniqueConstraint(
                fields=["program", "branch_code"],
                name="unique_branch_code_per_program",
            )
        ]

    def __str__(self):
        return f"{self.branch_name} ({self.branch_code})"


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address.")

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("role", User.Role.ADMIN)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_super_admin", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("role") != User.Role.ADMIN:
            raise ValueError("Superusers must use the admin role.")
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superusers must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superusers must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        STUDENT = "student", "Student"
        ADMIN = "admin", "Admin"

    full_name = models.CharField(max_length=120)
    email = models.EmailField(unique=True)
    college_id = models.CharField(max_length=40, unique=True)
    roll_number = models.CharField(max_length=40, unique=True, blank=True, null=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STUDENT, db_index=True)
    
    school = models.ForeignKey(School, on_delete=models.SET_NULL, null=True, blank=True, related_name="admins")
    is_super_admin = models.BooleanField(default=False)
    
    session_token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    last_login_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name", "college_id", "roll_number"]

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.full_name} ({self.email})"

    def rotate_session_token(self):
        self.session_token = uuid.uuid4()


class StudentProfile(models.Model):
    class Year(models.TextChoices):
        FIRST = "1", "1st Year"
        SECOND = "2", "2nd Year"
        THIRD = "3", "3rd Year"
        FOURTH = "4", "4th Year"

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="student_profile")
    school = models.ForeignKey(School, on_delete=models.PROTECT, related_name="student_profiles")
    program = models.ForeignKey(Program, on_delete=models.PROTECT, related_name="student_profiles")
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT, related_name="student_profiles")
    year = models.CharField(max_length=1, choices=Year.choices)
    profile_picture = models.ImageField(upload_to="student_profiles/", blank=True, null=True)
    last_badge = models.CharField(max_length=80, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["user__full_name"]

    def __str__(self):
        return f"{self.user.full_name} - {self.program.program_code}/{self.branch.branch_code}"
