from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from quizzes.models import Quiz, QuizRegistration, Question, Choice
from users.models import School, Program, Branch, StudentProfile
import io
import openpyxl

User = get_user_model()

class QuizEnrollmentTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create school program branch
        self.school = School.objects.create(school_name="Engineering School", school_code="SOET")
        self.program = Program.objects.create(school=self.school, program_name="Computer Science", program_code="CSE_PROG")
        self.branch = Branch.objects.create(program=self.program, branch_name="CSE Branch", branch_code="CSE")
        
        # Create admin user
        self.admin_user = User.objects.create_superuser(
            email="admin@quizverse.edu",
            password="adminpassword123",
            full_name="System Admin",
            college_id="ADMIN001"
        )
        
        # Authenticate
        self.client.force_authenticate(user=self.admin_user)
        
        # Create active quiz
        self.quiz = Quiz.objects.create(
            title="KBC Arena Live Testing Quiz",
            description="Testing live event",
            status=Quiz.Status.REGISTRATION_OPEN,
            event_password="KBC123",
            created_by=self.admin_user
        )

    def test_manual_enroll_student(self):
        url = f"/api/quizzes/admin/{self.quiz.id}/enroll_student_manual/"
        payload = {
            "email": "contestant@quizverse.edu",
            "full_name": "Contestant One",
            "college_id": "ST001",
            "payment_status": "paid"
        }
        
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("Successfully enrolled", response.data["detail"])
        
        # Verify database creation
        self.assertTrue(User.objects.filter(email="contestant@quizverse.edu").exists())
        student = User.objects.get(email="contestant@quizverse.edu")
        self.assertEqual(student.full_name, "Contestant One")
        self.assertEqual(student.college_id, "ST001")
        
        # Verify student profile created automatically
        self.assertTrue(hasattr(student, "student_profile"))
        
        # Verify registration created
        self.assertTrue(QuizRegistration.objects.filter(student=student, quiz=self.quiz).exists())
        reg = QuizRegistration.objects.get(student=student, quiz=self.quiz)
        self.assertEqual(reg.payment_status, "paid")
        self.assertEqual(reg.player_id, "PLAYER 001")

    def test_manual_enroll_duplicate_returns_ok_with_updated_status(self):
        # First enroll
        url = f"/api/quizzes/admin/{self.quiz.id}/enroll_student_manual/"
        payload = {
            "email": "contestant@quizverse.edu",
            "full_name": "Contestant One",
            "college_id": "ST001",
            "payment_status": "pending"
        }
        self.client.post(url, payload, format="json")
        
        # Re-enroll with status paid
        payload["payment_status"] = "paid"
        response = self.client.post(url, payload, format="json")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("already registered", response.data["detail"])
        
        # Check DB payment_status updated
        reg = QuizRegistration.objects.get(student__email="contestant@quizverse.edu", quiz=self.quiz)
        self.assertEqual(reg.payment_status, "paid")

    def test_download_enrollment_template(self):
        url = "/api/quizzes/admin/download_enrollment_template/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        
        # Verify xlsx contents
        wb = openpyxl.load_workbook(io.BytesIO(response.content))
        ws = wb.active
        self.assertEqual(ws.title, "Student Enrollment Template")
        headers = [cell.value for cell in ws[1]]
        self.assertEqual(headers, ['Full Name', 'Email', 'Roll Number', 'Payment Status (paid/pending)'])

    def test_download_buzzer_template(self):
        url = "/api/quizzes/admin/download_template/?type=buzzer"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        
        # Verify xlsx contents
        wb = openpyxl.load_workbook(io.BytesIO(response.content))
        ws = wb.active
        self.assertEqual(ws.title, "Buzzer Round Template")
        headers = [cell.value for cell in ws[1]]
        self.assertEqual(headers, [
            'Question Text', 'Option A', 'Option B', 'Option C', 'Option D', 
            'Correct Option (A/B/C/D)', 'Marks', 
            'Question Type (buzzer)', 'Category', 'Trivia'
        ])

    def test_bulk_enroll_students_csv(self):
        url = f"/api/quizzes/admin/{self.quiz.id}/bulk_enroll_students/"
        csv_content = (
            "Full Name,Email,Roll Number,Payment Status (paid/pending)\n"
            "Bulk Student 1,bulk1@quizverse.edu,ST_BULK1,paid\n"
            "Bulk Student 2,bulk2@quizverse.edu,ST_BULK2,pending\n"
        )
        csv_file = io.BytesIO(csv_content.encode("utf-8"))
        csv_file.name = "students.csv"
        
        response = self.client.post(url, {"file": csv_file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Successfully enrolled 2 students", response.data["detail"])
        
        # Verify databases
        self.assertEqual(User.objects.filter(email__contains="bulk").count(), 2)
        u1 = User.objects.get(email="bulk1@quizverse.edu")
        u2 = User.objects.get(email="bulk2@quizverse.edu")
        self.assertEqual(u1.college_id, "ST_BULK1")
        self.assertEqual(u2.college_id, "ST_BULK2")
        self.assertEqual(u1.roll_number, "ST_BULK1")
        self.assertEqual(u2.roll_number, "ST_BULK2")
        
        reg1 = QuizRegistration.objects.get(student=u1, quiz=self.quiz)
        reg2 = QuizRegistration.objects.get(student=u2, quiz=self.quiz)
        self.assertEqual(reg1.payment_status, "paid")
        self.assertEqual(reg2.payment_status, "pending")


class QuizBuzzerTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create school program branch
        self.school = School.objects.create(school_name="Engineering School", school_code="SOET")
        self.program = Program.objects.create(school=self.school, program_name="Computer Science", program_code="CSE_PROG")
        self.branch = Branch.objects.create(program=self.program, branch_name="CSE Branch", branch_code="CSE")
        
        # Create admin user
        self.admin_user = User.objects.create_superuser(
            email="admin2@quizverse.edu",
            password="adminpassword123",
            full_name="System Admin",
            college_id="ADMIN002"
        )
        self.admin_user.role = "admin"
        self.admin_user.save()
        
        # Create student users
        self.students = []
        for i in range(6):
            student = User.objects.create_user(
                email=f"student{i}@quizverse.edu",
                password="studentpassword123",
                full_name=f"Student {i}",
                college_id=f"ST{100 + i}",
                role="student"
            )
            StudentProfile.objects.create(
                user=student,
                school=self.school,
                program=self.program,
                branch=self.branch,
                year=StudentProfile.Year.FIRST
            )
            self.students.append(student)

        # Create active quiz in Buzzer Round stage
        self.quiz = Quiz.objects.create(
            title="Buzzer Quiz",
            description="Buzzer round testing",
            status=Quiz.Status.REGISTRATION_OPEN,
            event_password="BUZZ123",
            created_by=self.admin_user,
            current_stage=Quiz.Stage.BUZZER_ROUND
        )

        # Register students
        for student in self.students:
            QuizRegistration.objects.create(
                student=student,
                quiz=self.quiz,
                payment_status="paid"
            )

        # Create a buzzer round question
        self.question = Question.objects.create(
            quiz=self.quiz,
            text="Sample Buzzer Question",
            question_type=Question.QuestionType.BUZZER,
            marks=10,
            order=1
        )
        
        Choice.objects.create(question=self.question, text="Choice A", is_correct=True)
        Choice.objects.create(question=self.question, text="Choice B", is_correct=False)
        Choice.objects.create(question=self.question, text="Choice C", is_correct=False)
        Choice.objects.create(question=self.question, text="Choice D", is_correct=False)

    def test_team_size_limit(self):
        # Authenticate first student
        self.client.force_authenticate(user=self.students[0])
        
        # Create team
        create_url = "/api/quizzes/teams/"
        response = self.client.post(create_url, {"quiz": self.quiz.id, "name": "Buzzer Team"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        team_id = response.data["id"]
        
        # Add 2nd, 3rd, 4th student to the team.
        for i in range(1, 4):
            self.client.force_authenticate(user=self.students[i])
            join_url = f"/api/quizzes/teams/{team_id}/join/"
            response = self.client.post(join_url, format="json")
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
        # Try to join 5th student - should fail
        self.client.force_authenticate(user=self.students[4])
        join_url = f"/api/quizzes/teams/{team_id}/join/"
        response = self.client.post(join_url, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("maximum size of 4 members", response.data["detail"])

    def test_buzzer_round_mechanics(self):
        # 1. Initialize buzzer round
        self.client.force_authenticate(user=self.admin_user)
        init_url = f"/api/quizzes/admin/{self.quiz.id}/buzzer_init/"
        response = self.client.post(init_url, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify initial state
        state_data = response.data
        self.assertEqual(state_data["current_question"]["id"], self.question.id)
        self.assertTrue(state_data["buzzers_locked"])
        self.assertIsNone(state_data["active_buzzer_id"])
        
        # 2. Press buzzer (succeeds even though buzzers are technically in initial locked state)
        self.client.force_authenticate(user=self.students[0])
        press_url = f"/api/quizzes/{self.quiz.id}/press-buzzer/"
        response = self.client.post(press_url, {"buzzer_id": "1"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["active_buzzer_id"], "1")
        
        # 3. Release buzzers (unlock/reset active buzzer)
        self.client.force_authenticate(user=self.admin_user)
        release_url = f"/api/quizzes/admin/{self.quiz.id}/buzzer_release/"
        response = self.client.post(release_url, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["buzzers_locked"])
        
        # 4. Check live state - timer is not running, active_buzzer_id is None
        live_state_url = f"/api/quizzes/{self.quiz.id}/live-state/"
        self.client.force_authenticate(user=self.students[0])
        response = self.client.get(live_state_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        buzzer_state = response.data["buzzer_state"]
        self.assertIsNone(buzzer_state["active_buzzer_id"])
        self.assertFalse(buzzer_state["is_timer_running"])
        
        # 5. Press buzzer 1 again (succeeds because release deleted the previous press)
        self.client.force_authenticate(user=self.students[0])
        response = self.client.post(press_url, {"buzzer_id": "1"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["active_buzzer_id"], "1")

        # 6. Try to press buzzer 1 yet again (fails because it's already registered now)
        response = self.client.post(press_url, {"buzzer_id": "1"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already registered", response.data["detail"])
        
        # 7. Press another buzzer 2 (succeeds immediately because locks are bypassed)
        self.client.force_authenticate(user=self.students[1])
        response = self.client.post(press_url, {"buzzer_id": "2"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["active_buzzer_id"], "1")
        
        # 8. Admin marks buzzer 1 answer as incorrect (adds to incorrect list, clears active)
        self.client.force_authenticate(user=self.admin_user)
        incorrect_url = f"/api/quizzes/admin/{self.quiz.id}/buzzer_answer_incorrect/"
        response = self.client.post(incorrect_url, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data["active_buzzer_id"])
        self.assertFalse(response.data["is_timer_running"])
        self.assertIn("1", response.data["incorrect_buzzers"])
        
        # 9. Try to press buzzer 1 again (should be blocked since incorrect)
        self.client.force_authenticate(user=self.students[0])
        response = self.client.post(press_url, {"buzzer_id": "1"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("blocked", response.data["detail"])
        
        # 10. Press buzzer 3 (valid new buzzer)
        self.client.force_authenticate(user=self.students[2])
        response = self.client.post(press_url, {"buzzer_id": "3"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["active_buzzer_id"], "3")
        
        # 11. Admin marks buzzer 3 answer as correct (awards points)
        self.client.force_authenticate(user=self.admin_user)
        correct_url = f"/api/quizzes/admin/{self.quiz.id}/buzzer_answer_correct/"
        response = self.client.post(correct_url, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["answer_visible"])
        self.assertEqual(response.data["buzzer_mappings"]["3"]["score"], 10)
        
        # 12. Update mappings and timer limit
        update_url = f"/api/quizzes/admin/{self.quiz.id}/buzzer_update_mappings/"
        new_mappings = response.data["buzzer_mappings"]
        new_mappings["3"]["name"] = "Team Super"
        response = self.client.post(update_url, {"mappings": new_mappings, "timer_limit": 25}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["buzzer_mappings"]["3"]["name"], "Team Super")
        self.assertEqual(response.data["answer_timer_limit"], 25)

