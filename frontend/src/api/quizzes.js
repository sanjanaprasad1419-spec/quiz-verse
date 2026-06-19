import { getAuthSession, clearAuthSession } from './auth';

let rawApiUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';
const API_BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api`;

async function request(path, options, tokenParam) {
  const headers = {
    ...(options?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  };

  const token = tokenParam || getAuthSession()?.token;

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  let data = {};
  try {
    data = await response.json();
  } catch (e) {
    // some responses might be empty
  }

  if (!response.ok) {
    const error = new Error(data.detail || data.message || 'Request failed.');
    error.data = data;
    error.status = response.status;
    throw error;
  }

  return data;
}

export function getPublishedQuizzes(token) {
  return request('/quizzes/published/', { method: 'GET' }, token);
}

export function getQuizDetails(id, token) {
  return request(`/quizzes/${id}/`, { method: 'GET' }, token);
}

export function getMyRegistrations(token) {
  return request('/quizzes/my-registrations/', { method: 'GET' }, token);
}

export function registerForQuiz(id, token) {
  return request(`/quizzes/${id}/register/`, { method: 'POST' }, token);
}

export function processMockPayment(id, token) {
  return request(`/quizzes/${id}/mock-payment/`, { method: 'POST' }, token);
}

// Admin Methods
export function getAdminStats(token) {
  return request('/quizzes/admin-stats/', { method: 'GET' }, token);
}

export function getAdminQuizzes(token) {
  return request('/quizzes/admin/', { method: 'GET' }, token);
}

export function createAdminQuiz(payload, token) {
  return request('/quizzes/admin/', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export function updateAdminQuiz(id, payload, token) {
  return request(`/quizzes/admin/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }, token);
}

export function deleteAdminQuiz(id, token) {
  return request(`/quizzes/admin/${id}/`, { method: 'DELETE' }, token);
}

// Quiz Attempt Methods
export function startQuizAttempt(id, token) {
  return request(`/quizzes/${id}/start/`, { method: 'POST' }, token);
}

export function getNextQuestion(id, token) {
  return request(`/quizzes/${id}/next/`, { method: 'GET' }, token);
}

export function submitQuizAnswer(id, choiceId, timeTaken, token) {
  return request(`/quizzes/${id}/submit/`, {
    method: 'POST',
    body: JSON.stringify({ choice_id: choiceId, time_taken: timeTaken }),
  }, token);
}

// Team Methods
export function getTeams(token) {
  return request(`/quizzes/teams/`, {}, token);
}

export function createTeam(payload, token) {
  return request(`/quizzes/teams/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export function joinTeam(teamId, token) {
  return request(`/quizzes/teams/${teamId}/join/`, {
    method: 'POST',
  }, token);
}

// ==========================================
// KBC Live Arena API Endpoints (Student)
// ==========================================

export function verifyQuizAccess(id, playerId, eventPassword, token) {
  return request(`/quizzes/${id}/verify-access/`, {
    method: 'POST',
    body: JSON.stringify({ player_id: playerId, event_password: eventPassword }),
  }, token);
}

export function getQuizLiveState(id, token) {
  return request(`/quizzes/${id}/live-state/`, { method: 'GET' }, token);
}

export function submitFFFAnswer(id, choiceId, timeTakenSeconds, token, selectedSequence = []) {
  return request(`/quizzes/${id}/fff-submit/`, {
    method: 'POST',
    body: JSON.stringify({ 
      choice_id: choiceId, 
      time_taken_seconds: timeTakenSeconds, 
      selected_sequence: selectedSequence 
    }),
  }, token);
}

export function getMyRegistration(id, token) {
  return request(`/quizzes/${id}/my-registration/`, { method: 'GET' }, token);
}

export function getHotseatQuestion(id, token) {
  return request(`/quizzes/${id}/hotseat-question/`, { method: 'GET' }, token);
}

export function submitHotseatAnswer(id, choiceId, token) {
  return request(`/quizzes/${id}/hotseat-submit/`, {
    method: 'POST',
    body: JSON.stringify({ choice_id: choiceId }),
  }, token);
}

export function triggerHotseatLifeline(id, lifelineType, category = '', token) {
  return request(`/quizzes/${id}/hotseat-lifeline/`, {
    method: 'POST',
    body: JSON.stringify({ lifeline_type: lifelineType, category }),
  }, token);
}

export function requestHotseatLifeline(id, lifelineType, category = '', token) {
  return request(`/quizzes/${id}/hotseat-lifeline-request/`, {
    method: 'POST',
    body: JSON.stringify({ lifeline_type: lifelineType, category }),
  }, token);
}

export function acknowledgeHotseatLifeline(id, token) {
  return request(`/quizzes/${id}/hotseat-lifeline-acknowledge/`, {
    method: 'POST',
  }, token);
}

export function approveHotseatLifeline(id, token) {
  return request(`/quizzes/admin/${id}/approve_lifeline/`, {
    method: 'POST',
  }, token);
}

export function rejectHotseatLifeline(id, token) {
  return request(`/quizzes/admin/${id}/reject_lifeline/`, {
    method: 'POST',
  }, token);
}

export function confirmHotseatSwitchCategory(id, token) {
  return request(`/quizzes/admin/${id}/confirm_switch_lifeline/`, {
    method: 'POST',
  }, token);
}

export function hotseatWalkAway(id, token) {
  return request(`/quizzes/${id}/hotseat-walk-away/`, { method: 'POST' }, token);
}

export function hotseatPreselect(id, choiceId, token) {
  return request(`/quizzes/${id}/hotseat-preselect/`, {
    method: 'POST',
    body: JSON.stringify({ choice_id: choiceId }),
  }, token);
}

export function submitSpectatorVote(id, choiceId, token) {
  return request(`/quizzes/${id}/spectator-vote/`, {
    method: 'POST',
    body: JSON.stringify({ choice_id: choiceId }),
  }, token);
}


// ==========================================
// KBC Live Controller API Endpoints (Admin)
// ==========================================

export function updateQuizStage(id, stage, token) {
  return request(`/quizzes/admin/${id}/update_stage/`, {
    method: 'POST',
    body: JSON.stringify({ stage }),
  }, token);
}

export function setQuizBatches(id, batch_1, batch_2, batch_3, token) {
  return request(`/quizzes/admin/${id}/set_batches/`, {
    method: 'POST',
    body: JSON.stringify({ batch_1, batch_2, batch_3 }),
  }, token);
}

export function getFFFResults(id, token) {
  return request(`/quizzes/admin/${id}/fff_results/`, { method: 'GET' }, token);
}

export function promoteToHotseat(id, studentId, token) {
  return request(`/quizzes/admin/${id}/promote_hotseat/`, {
    method: 'POST',
    body: JSON.stringify({ student_id: studentId }),
  }, token);
}

export function getPrelimScores(id, token) {
  return request(`/quizzes/admin/${id}/prelim_scores/`, { method: 'GET' }, token);
}

export function getHostHotseatQuestion(id, token) {
  return request(`/quizzes/admin/${id}/host_hotseat_question/`, { method: 'GET' }, token);
}

export function hostLockAnswer(id, token) {
  return request(`/quizzes/admin/${id}/host_lock_answer/`, { method: 'POST' }, token);
}

export function getEnrolledStudents(quizId, token) {
  return request(`/quizzes/admin/${quizId}/enrolled_students/`, { method: 'GET' }, token);
}

export function removeRegistration(quizId, registrationId, token) {
  return request(`/quizzes/admin/${quizId}/remove_registration/`, {
    method: 'POST',
    body: JSON.stringify({ registration_id: registrationId }),
  }, token);
}

export function enrollStudentManual(quizId, payload, token) {
  return request(`/quizzes/admin/${quizId}/enroll_student_manual/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export function bulkEnrollStudents(quizId, file, token) {
  const formData = new FormData();
  formData.append('file', file);
  return request(`/quizzes/admin/${quizId}/bulk_enroll_students/`, {
    method: 'POST',
    body: formData,
  }, token);
}

export async function downloadEnrollmentTemplate(token) {
  const t = token || getAuthSession()?.token;
  const res = await fetch(`${API_BASE_URL}/quizzes/admin/download_enrollment_template/`, {
    method: 'GET',
    headers: t ? { 'Authorization': `Bearer ${t}` } : {},
  });
  if (!res.ok) throw new Error('Failed to download student enrollment template');
  return res.blob();
}

export function hostShowOptions(quizId, token) {
  return request(`/quizzes/admin/${quizId}/show_options/`, { method: 'POST' }, token);
}

export function hostPauseTimer(quizId, token) {
  return request(`/quizzes/admin/${quizId}/pause_timer/`, { method: 'POST' }, token);
}

export function hostResumeTimer(quizId, token) {
  return request(`/quizzes/admin/${quizId}/resume_timer/`, { method: 'POST' }, token);
}

export function hostNextQuestion(quizId, token) {
  return request(`/quizzes/admin/${quizId}/next_question/`, { method: 'POST' }, token);
}

export function hostTriggerIntro(quizId, token) {
  return request(`/quizzes/admin/${quizId}/trigger_intro/`, { method: 'POST' }, token);
}

export function hostCompleteIntro(quizId, token) {
  return request(`/quizzes/admin/${quizId}/complete_intro/`, { method: 'POST' }, token);
}

export function getSwitchCategories(id, token) {
  return request(`/quizzes/${id}/switch-categories/`, { method: 'GET' }, token);
}

export function selectHotseatSwitchCategory(id, categoryId, token) {
  return request(`/quizzes/${id}/hotseat-select-switch-category/`, {
    method: 'POST',
    body: JSON.stringify({ category_id: categoryId }),
  }, token);
}

export function getAdminSwitchCategories(quizId, token) {
  return request(`/quizzes/admin/${quizId}/switch_categories/`, { method: 'GET' }, token);
}

export function saveAdminSwitchCategory(quizId, formData, token) {
  return request(`/quizzes/admin/${quizId}/save_switch_category/`, {
    method: 'POST',
    body: formData,
  }, token);
}

export function deleteAdminSwitchCategory(quizId, categoryId, token) {
  return request(`/quizzes/admin/${quizId}/delete_switch_category/`, {
    method: 'POST',
    body: JSON.stringify({ category_id: categoryId }),
  }, token);
}

export function getSystemPreferences(token) {
  return request('/quizzes/admin/preferences/', { method: 'GET' }, token);
}

export function saveSystemPreferences(payload, token) {
  return request('/quizzes/admin/preferences/', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export function pressBuzzer(id, buzzerId, token) {
  return request(`/quizzes/${id}/press-buzzer/`, {
    method: 'POST',
    body: JSON.stringify({ buzzer_id: buzzerId }),
  }, token);
}

export function buzzerInit(id, token) {
  return request(`/quizzes/admin/${id}/buzzer_init/`, { method: 'POST' }, token);
}

export function buzzerNextQuestion(id, token) {
  return request(`/quizzes/admin/${id}/buzzer_next_question/`, { method: 'POST' }, token);
}

export function buzzerRelease(id, token) {
  return request(`/quizzes/admin/${id}/buzzer_release/`, { method: 'POST' }, token);
}

export function buzzerAnswerCorrect(id, token) {
  return request(`/quizzes/admin/${id}/buzzer_answer_correct/`, { method: 'POST' }, token);
}

export function buzzerAnswerIncorrect(id, token) {
  return request(`/quizzes/admin/${id}/buzzer_answer_incorrect/`, { method: 'POST' }, token);
}

export function buzzerReset(id, token) {
  return request(`/quizzes/admin/${id}/buzzer_reset/`, { method: 'POST' }, token);
}

export function buzzerUpdateMappings(id, mappings, timerLimit, buzzerCount, token) {
  return request(`/quizzes/admin/${id}/buzzer_update_mappings/`, {
    method: 'POST',
    body: JSON.stringify({ mappings, timer_limit: timerLimit, buzzer_count: buzzerCount }),
  }, token);
}

export function buzzerRevealOptions(id, token) {
  return request(`/quizzes/admin/${id}/buzzer_reveal_options/`, { method: 'POST' }, token);
}

export function buzzerRevealAnswer(id, token) {
  return request(`/quizzes/admin/${id}/buzzer_reveal_answer/`, { method: 'POST' }, token);
}



