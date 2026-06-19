from rest_framework import serializers
from users.serializers import UserPublicSerializer

from quizzes.models import Quiz, QuizRegistration, Question, SwitchCategory, SystemPreferences, BuzzerState, BuzzerPress


class QuizSerializer(serializers.ModelSerializer):
    registered_count = serializers.IntegerField(read_only=True)
    remaining_seats = serializers.SerializerMethodField()
    hotseat_player_1_name = serializers.CharField(source='hotseat_player_1.full_name', read_only=True)
    hotseat_player_2_name = serializers.CharField(source='hotseat_player_2.full_name', read_only=True)
    hotseat_player_3_name = serializers.CharField(source='hotseat_player_3.full_name', read_only=True)
    host_name = serializers.CharField(source='host.full_name', read_only=True)
    
    total_questions_count = serializers.SerializerMethodField()
    prelim_questions_count = serializers.SerializerMethodField()
    fff_questions_count = serializers.SerializerMethodField()
    hotseat_1_questions_count = serializers.SerializerMethodField()
    hotseat_2_questions_count = serializers.SerializerMethodField()
    hotseat_3_questions_count = serializers.SerializerMethodField()
    switch_categories_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Quiz
        fields = [
            'id', 'title', 'description', 'event_date', 
            'registration_open_date', 'registration_close_date', 
            'status', 'visible_to_students', 'is_registration_open', 'is_archived',
            'max_participants', 'registration_fee', 'banner_image', 'intro_title',
            'rules_instructions', 'allowed_schools', 'allowed_programs', 
            'allowed_branches', 'allowed_years', 'registered_count', 'remaining_seats',
            'event_password', 'current_stage', 'top_30_selected', 
            'batch_1_players', 'batch_2_players', 'batch_3_players',
            'hotseat_player_1', 'hotseat_player_2', 'hotseat_player_3',
            'hotseat_player_1_name', 'hotseat_player_2_name', 'hotseat_player_3_name',
            'hotseat_score_1', 'hotseat_score_2', 'hotseat_score_3',
            'hotseat_status_1', 'hotseat_status_2', 'hotseat_status_3',
            'created_at', 'updated_at',
            'total_questions_count', 'prelim_questions_count', 'fff_questions_count',
            'hotseat_1_questions_count', 'hotseat_2_questions_count', 'hotseat_3_questions_count',
            'switch_categories_count', 'host', 'host_name'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']
        
    def get_remaining_seats(self, obj):
        if obj.max_participants is None:
            return None
        count = getattr(obj, 'registered_count', 0)
        return max(0, obj.max_participants - count)

    def get_total_questions_count(self, obj):
        return obj.questions.count()

    def get_prelim_questions_count(self, obj):
        return obj.questions.filter(question_type='regular').count()

    def get_fff_questions_count(self, obj):
        return obj.questions.filter(question_type__in=['fff_1', 'fff_2', 'fff_3']).count()

    def get_hotseat_1_questions_count(self, obj):
        return obj.questions.filter(question_type='hotseat_1').count()

    def get_hotseat_2_questions_count(self, obj):
        return obj.questions.filter(question_type='hotseat_2').count()

    def get_hotseat_3_questions_count(self, obj):
        return obj.questions.filter(question_type='hotseat_3').count()

    def get_switch_categories_count(self, obj):
        return obj.switch_categories.count()


class QuizRegistrationSerializer(serializers.ModelSerializer):
    quiz_details = QuizSerializer(source='quiz', read_only=True)
    arena_password = serializers.SerializerMethodField()
    
    class Meta:
        model = QuizRegistration
        fields = [
            'id', 'quiz', 'quiz_details', 'registered_at', 'updated_at',
            'payment_status', 'sequence_number', 'player_id', 'arena_password'
        ]
        read_only_fields = [
            'registered_at', 'updated_at', 'payment_status', 
            'sequence_number', 'player_id', 'quiz_details'
        ]

    def get_arena_password(self, obj):
        if obj.payment_status == QuizRegistration.PaymentStatus.PAID:
            return obj.arena_password
        return "LOCKED (AWAITING PAYMENT)"

class EnrolledStudentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    college_id = serializers.CharField(source='student.college_id', read_only=True)

    class Meta:
        model = QuizRegistration
        fields = [
            'id', 'student_name', 'student_email', 'college_id',
            'payment_status', 'sequence_number', 'player_id', 'arena_password', 'registered_at'
        ]

from quizzes.models import Question, Choice, QuizAttempt, StudentAnswer

class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'text']
        # Do not include is_correct so students can't inspect the API

class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'text', 'order', 'marks', 'question_type', 'category', 'choices', 'trivia']

class QuizAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAttempt
        fields = ['id', 'quiz', 'started_at', 'completed_at', 'score', 'current_question_index']

from quizzes.models import Team

class TeamSerializer(serializers.ModelSerializer):
    leader_name = serializers.CharField(source='leader.full_name', read_only=True)
    member_names = serializers.SerializerMethodField()
    
    class Meta:
        model = Team
        fields = ['id', 'name', 'quiz', 'leader', 'leader_name', 'members', 'member_names', 'created_at']
        read_only_fields = ['leader', 'members', 'quiz']

    def get_member_names(self, obj):
        return [m.full_name for m in obj.members.all()]
        read_only_fields = ['started_at', 'completed_at', 'score', 'current_question_index']


from quizzes.models import FFFAnswer, HotseatAttempt

class FFFAnswerSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    player_id = serializers.SerializerMethodField()

    class Meta:
        model = FFFAnswer
        fields = ['id', 'quiz', 'student', 'student_name', 'player_id', 'batch_number', 'question', 'selected_choice', 'time_taken_seconds', 'submitted_at', 'is_correct', 'submitted_sequence']
        read_only_fields = ['submitted_at']

    def get_player_id(self, obj):
        reg = QuizRegistration.objects.filter(student=obj.student, quiz=obj.quiz).first()
        return reg.player_id if reg else ""


class HotseatAttemptSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    player_id = serializers.SerializerMethodField()

    class Meta:
        model = HotseatAttempt
        fields = [
            'id', 'quiz', 'student', 'student_name', 'player_id', 'batch_number', 
            'current_question_index', 'score', 'status', 'lifeline_5050_used', 
            'lifeline_poll_used', 'lifeline_switch_used', 'started_at', 'completed_at',
            'pending_lifeline_type', 'pending_lifeline_switch_category', 
            'lifeline_request_status', 'approved_lifeline_data', 'current_question_switched',
            'timer_is_paused', 'options_visible', 'showing_question', 'show_intro', 'intro_played'
        ]
        read_only_fields = ['started_at', 'completed_at']

    def get_player_id(self, obj):
        reg = QuizRegistration.objects.filter(student=obj.student, quiz=obj.quiz).first()
        return reg.player_id if reg else ""


from quizzes.models import SwitchCategory

class SwitchCategorySerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.text', read_only=True)
    
    class Meta:
        model = SwitchCategory
        fields = ['id', 'quiz', 'name', 'image', 'question', 'question_text']


class SystemPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemPreferences
        fields = [
            'prelim_mcq_timer',
            'fff_speed_timer',
            'hotseat_q1_q5_limit',
            'hotseat_q6_q10_limit',
            'auto_approve_registrations',
        ]


class BuzzerPressSerializer(serializers.ModelSerializer):
    class Meta:
        model = BuzzerPress
        fields = ['id', 'quiz', 'question', 'buzzer_id', 'pressed_at', 'time_taken_seconds']


class BuzzerStateSerializer(serializers.ModelSerializer):
    current_question = QuestionSerializer(read_only=True)
    current_question_text = serializers.CharField(source='current_question.text', read_only=True)
    choices = ChoiceSerializer(source='current_question.choices', many=True, read_only=True)
    correct_choice_id = serializers.SerializerMethodField()
    presses = serializers.SerializerMethodField()

    class Meta:
        model = BuzzerState
        fields = [
            'id', 'quiz', 'current_question', 'current_question_text', 'choices', 
            'answer_timer_limit', 'buzzer_count', 'timer_started_at', 'timer_paused_at', 
            'is_timer_running', 'buzzers_locked', 'options_visible', 
            'answer_visible', 'buzzer_mappings', 'incorrect_buzzers', 
            'active_buzzer_id', 'correct_choice_id', 'presses'
        ]

    def get_correct_choice_id(self, obj):
        if obj.current_question:
            correct = obj.current_question.choices.filter(is_correct=True).first()
            return correct.id if correct else None
        return None

    def get_presses(self, obj):
        if obj.current_question:
            presses = obj.quiz.buzzer_presses.filter(question=obj.current_question).order_by('pressed_at', 'id')
            return BuzzerPressSerializer(presses, many=True).data
        return []



