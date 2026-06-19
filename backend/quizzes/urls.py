from django.urls import include, path
from rest_framework.routers import DefaultRouter

from quizzes.views import (
    AdminQuizViewSet,
    AdminStatsView,
    MockPaymentView,
    MyRegistrationsView,
    PublishedQuizListView,
    QuizDetailView,
    StudentRegistrationView,
    QuizAttemptStartView,
    QuizAttemptNextQuestionView,
    QuizAttemptSubmitAnswerView,
    StudentTeamViewSet,
    VerifyQuizAccessView,
    QuizLiveStateView,
    FFFSubmitView,
    HotseatQuestionView,
    HotseatSubmitView,
    HotseatLifelineView,
    HotseatWalkAwayView,
    HotseatPreselectView,
    MyQuizRegistrationView,
    HotseatLifelineRequestView,
    HotseatLifelineAcknowledgeView,
    AdminApproveLifelineView,
    AdminRejectLifelineView,
    AdminShowOptionsView,
    AdminPauseTimerView,
    AdminResumeTimerView,
    AdminNextQuestionReadyView,
    AdminTriggerIntroView,
    AdminCompleteIntroView,
    StudentSwitchCategoryListView,
    HotseatSelectSwitchCategoryView,
    AdminConfirmSwitchLifelineView,
    SystemPreferencesView,
    SpectatorVoteView,
    QuizDetailedReportView,
    PressBuzzerView,
    BuzzerInitView,
    BuzzerNextQuestionView,
    BuzzerReleaseView,
    BuzzerAnswerCorrectView,
    BuzzerAnswerIncorrectView,
    BuzzerResetView,
    BuzzerUpdateMappingsView,
    BuzzerRevealOptionsView,
    BuzzerRevealAnswerView,
)

router = DefaultRouter()
router.register(r'admin', AdminQuizViewSet, basename='admin-quizzes')
router.register(r'teams', StudentTeamViewSet, basename='student-teams')

urlpatterns = [
    # Admin routes
    path('admin-stats/', AdminStatsView.as_view(), name='admin-stats'),
    path('admin/preferences/', SystemPreferencesView.as_view(), name='quiz-admin-preferences'),
    path('<int:pk>/detailed-report/', QuizDetailedReportView.as_view(), name='quiz-detailed-report'),

    
    # Student routes
    path('published/', PublishedQuizListView.as_view(), name='published-quizzes'),
    path('my-registrations/', MyRegistrationsView.as_view(), name='my-registrations'),
    path('<int:pk>/', QuizDetailView.as_view(), name='quiz-detail'),
    path('<int:pk>/register/', StudentRegistrationView.as_view(), name='quiz-register'),
    path('<int:pk>/mock-payment/', MockPaymentView.as_view(), name='quiz-mock-payment'),
    path('<int:pk>/my-registration/', MyQuizRegistrationView.as_view(), name='quiz-my-registration'),
    
    # Quiz attempt flow
    path('<int:pk>/start/', QuizAttemptStartView.as_view(), name='quiz-start'),
    path('<int:pk>/next/', QuizAttemptNextQuestionView.as_view(), name='quiz-next-question'),
    path('<int:pk>/submit/', QuizAttemptSubmitAnswerView.as_view(), name='quiz-submit-answer'),

    # KBC Live Arena routes
    path('<int:pk>/verify-access/', VerifyQuizAccessView.as_view(), name='quiz-verify-access'),
    path('<int:pk>/live-state/', QuizLiveStateView.as_view(), name='quiz-live-state'),
    path('<int:pk>/fff-submit/', FFFSubmitView.as_view(), name='quiz-fff-submit'),
    path('<int:pk>/hotseat-question/', HotseatQuestionView.as_view(), name='quiz-hotseat-question'),
    path('<int:pk>/hotseat-submit/', HotseatSubmitView.as_view(), name='quiz-hotseat-submit'),
    path('<int:pk>/hotseat-lifeline/', HotseatLifelineView.as_view(), name='quiz-hotseat-lifeline'),
    path('<int:pk>/hotseat-walk-away/', HotseatWalkAwayView.as_view(), name='quiz-hotseat-walk-away'),
    path('<int:pk>/hotseat-preselect/', HotseatPreselectView.as_view(), name='quiz-hotseat-preselect'),
    path('<int:pk>/hotseat-lifeline-request/', HotseatLifelineRequestView.as_view(), name='quiz-hotseat-lifeline-request'),
    path('<int:pk>/hotseat-lifeline-acknowledge/', HotseatLifelineAcknowledgeView.as_view(), name='quiz-hotseat-lifeline-acknowledge'),
    path('<int:pk>/spectator-vote/', SpectatorVoteView.as_view(), name='quiz-spectator-vote'),
    path('<int:pk>/switch-categories/', StudentSwitchCategoryListView.as_view(), name='quiz-switch-categories'),
    path('<int:pk>/hotseat-select-switch-category/', HotseatSelectSwitchCategoryView.as_view(), name='quiz-hotseat-select-switch-category'),
    path('admin/<int:pk>/approve_lifeline/', AdminApproveLifelineView.as_view(), name='quiz-admin-approve-lifeline'),
    path('admin/<int:pk>/reject_lifeline/', AdminRejectLifelineView.as_view(), name='quiz-admin-reject-lifeline'),
    path('admin/<int:pk>/show_options/', AdminShowOptionsView.as_view(), name='quiz-admin-show-options'),
    path('admin/<int:pk>/pause_timer/', AdminPauseTimerView.as_view(), name='quiz-admin-pause-timer'),
    path('admin/<int:pk>/resume_timer/', AdminResumeTimerView.as_view(), name='quiz-admin-resume-timer'),
    path('admin/<int:pk>/next_question/', AdminNextQuestionReadyView.as_view(), name='quiz-admin-next-question'),
    path('admin/<int:pk>/trigger_intro/', AdminTriggerIntroView.as_view(), name='quiz-admin-trigger-intro'),
    path('admin/<int:pk>/complete_intro/', AdminCompleteIntroView.as_view(), name='quiz-admin-complete-intro'),
    path('admin/<int:pk>/confirm_switch_lifeline/', AdminConfirmSwitchLifelineView.as_view(), name='quiz-admin-confirm-switch-lifeline'),

    # KBC Buzzer Round routes
    path('<int:pk>/press-buzzer/', PressBuzzerView.as_view(), name='quiz-press-buzzer'),
    path('admin/<int:pk>/buzzer_init/', BuzzerInitView.as_view(), name='quiz-admin-buzzer-init'),
    path('admin/<int:pk>/buzzer_next_question/', BuzzerNextQuestionView.as_view(), name='quiz-admin-buzzer-next-question'),
    path('admin/<int:pk>/buzzer_release/', BuzzerReleaseView.as_view(), name='quiz-admin-buzzer-release'),
    path('admin/<int:pk>/buzzer_answer_correct/', BuzzerAnswerCorrectView.as_view(), name='quiz-admin-buzzer-answer-correct'),
    path('admin/<int:pk>/buzzer_answer_incorrect/', BuzzerAnswerIncorrectView.as_view(), name='quiz-admin-buzzer-answer-incorrect'),
    path('admin/<int:pk>/buzzer_reset/', BuzzerResetView.as_view(), name='quiz-admin-buzzer-reset'),
    path('admin/<int:pk>/buzzer_update_mappings/', BuzzerUpdateMappingsView.as_view(), name='quiz-admin-buzzer-update-mappings'),
    path('admin/<int:pk>/buzzer_reveal_options/', BuzzerRevealOptionsView.as_view(), name='quiz-admin-buzzer-reveal-options'),
    path('admin/<int:pk>/buzzer_reveal_answer/', BuzzerRevealAnswerView.as_view(), name='quiz-admin-buzzer-reveal-answer'),

    # Router URLs last to avoid overriding specific student routes
    path('', include(router.urls)),
]

