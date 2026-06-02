import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAuthSession, saveAuthSession, getSchools, getProgramsBySchool, getBranchesByProgram, updateUserCredentials, getAdminStudents, createAdminStudent, deleteAdminStudent, bulkUploadStudents, downloadStudentTemplate, updateAdminStudent, getSchoolAdmins, createSchoolAdmin, updateSchoolAdmin, deleteSchoolAdmin } from '../../api/auth';
import {
  getAdminQuizzes,
  updateAdminQuiz,
  createAdminQuiz,
  getAdminStats,
  deleteAdminQuiz,
  updateQuizStage,
  setQuizBatches,
  getFFFResults,
  promoteToHotseat,
  getPrelimScores,
  getQuizDetails,
  getQuizLiveState,
  getEnrolledStudents,
  removeRegistration,
  enrollStudentManual,
  bulkEnrollStudents,
  downloadEnrollmentTemplate,
  hostTriggerIntro,
  hostCompleteIntro,
  getAdminSwitchCategories,
  saveAdminSwitchCategory,
  deleteAdminSwitchCategory,
  getSystemPreferences,
  saveSystemPreferences
} from '../../api/quizzes';
import KbcStageFx from '../KbcStageFx/KbcStageFx';
import './AdminDashboardPage.css';

let rawApiUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';
const API_BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api`;

const OverviewIcon = ({ size = 20, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
);

const QuizzesIcon = ({ size = 20, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <path d="M9 6h6" />
    <path d="M9 10h6" />
    <path d="M9 14h6" />
  </svg>
);

const AdminsIcon = ({ size = 20, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const KbcControllerIcon = ({ size = 20, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="6" y1="12" x2="10" y2="12" />
    <line x1="8" y1="10" x2="8" y2="14" />
    <line x1="15" y1="13" x2="15.01" y2="13" />
    <line x1="18" y1="11" x2="18.01" y2="11" />
    <rect x="2" y="6" width="20" height="12" rx="3" />
  </svg>
);

const EnrollmentIcon = ({ size = 20, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z" />
    <line x1="12" y1="5" x2="12" y2="19" strokeDasharray="4 4" />
  </svg>
);

const StudentsIcon = ({ size = 20, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const SettingsIcon = ({ size = 20, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const LogoutIcon = ({ size = 20, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const SchoolPortalIcon = ({ size = 20, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 22V4c0-.5.2-1 .6-1.4C5 2.2 5.5 2 6 2h12c.5 0 1 .2 1.4.6.4.4.6.9.6 1.4v18" />
    <path d="M10 22v-4a2 2 0 0 1 4 0v4" />
    <path d="M18 8h.01M18 12h.01M6 8h.01M6 12h.01M10 8h.01M14 8h.01" />
  </svg>
);

const PrelimsIcon = ({ size = 20, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
  </svg>
);

const LightningIcon = ({ size = 20, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const MicrophoneIcon = ({ size = 20, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
  </svg>
);

const TrophyIcon = ({ size = 20, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
    <path d="M12 2a6 6 0 0 1 6 6v3.5a6 6 0 0 1-12 0V8a6 6 0 0 1 6-6z" />
  </svg>
);

const SaveIcon = ({ size = 20, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const AlertIcon = ({ size = 20, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const KeyIcon = ({ size = 20, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

const PlusIcon = ({ size = 20, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const DownloadIcon = ({ size = 20, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const ShowtimeIcon = ({ size = 20, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
    <line x1="7" y1="2" x2="7" y2="22" />
    <line x1="17" y1="2" x2="17" y2="22" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="2" y1="7" x2="7" y2="7" />
    <line x1="2" y1="17" x2="7" y2="17" />
    <line x1="17" y1="17" x2="22" y2="17" />
    <line x1="17" y1="7" x2="22" y2="7" />
  </svg>
);

const FolderIcon = ({ size = 20, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const EditIcon = ({ size = 20, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const TrashIcon = ({ size = 20, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const SYMBOLS = {
  triangle: '\u25B3',
  circle: '\u25CB',
  square: '\u25A1',
  diamond: '\u25C7',
  dot: '\u00B7',
  gear: '\u2699',
  bell: '\u25CC',
  moon: '\u25D0',
  sun: '\u2609',
  exit: '\u21B3',
  users: '\u2689', // Placeholder user symbol
  quizzes: '\u229E', // Placeholder quiz symbol
};

function AdminDashboardInner({ showBeautifulPopup }) {
  const session = getAuthSession();
  const [theme, setTheme] = useState(() => localStorage.getItem('quizverse-theme') || 'dark');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('quizverse-admin-sidebar-collapsed') === 'true';
  });
  const [selectedPromoteStudentId, setSelectedPromoteStudentId] = useState('');
  const [coreOffset, setCoreOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    localStorage.setItem('quizverse-admin-sidebar-collapsed', isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  const [quizzes, setQuizzes] = useState([]);
  const [adminStats, setAdminStats] = useState({
    total_students: 0,
    total_quizzes: 0,
    active_quizzes: 0,
    total_registrations: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [showModal, setShowModal] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [formData, setFormData] = useState({
    title: '', description: '', rules_instructions: '', 
    event_date: '', event_time: '',
    registration_open_date: '', registration_open_time: '', 
    registration_close_date: '', registration_close_time: '', 
    max_participants: '100',
    registration_fee: '0', visible_to_students: false, is_registration_open: false,
    intro_title: 'Kaun Banega Crorepati',
    require_eligibility: false,
    eligibility_school: '',
    eligibility_programs: [],
    eligibility_branches: [],
    host: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [schools, setSchools] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [branches, setBranches] = useState([]);
  const [adminsList, setAdminsList] = useState([]);
  const [adminForm, setAdminForm] = useState({ full_name: '', email: '', college_id: '', password: '', school_id: '', is_super_admin: false });
  const [editingAdminId, setEditingAdminId] = useState(null);
  const [adminSubmitLoading, setAdminSubmitLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [selectedManageQuiz, setSelectedManageQuiz] = useState(null);
  const [showSwitchCategoryPanel, setShowSwitchCategoryPanel] = useState(false);
  const [adminSwitchCategories, setAdminSwitchCategories] = useState([]);
  const [loadingSwitchCategories, setLoadingSwitchCategories] = useState(false);
  const [editingSwitchCategory, setEditingSwitchCategory] = useState(null);
  const [switchCategoryForm, setSwitchCategoryForm] = useState({
    name: '',
    question_text: '',
    choice_a: '',
    choice_b: '',
    choice_c: '',
    choice_d: '',
    correct_choice: 'A',
    image: null
  });
  const [savingCategory, setSavingCategory] = useState(false);

  // Student Accounts States
  const [allStudents, setAllStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [addStudentForm, setAddStudentForm] = useState({
    full_name: '', roll_number: '', college_id: '', email: '',
    school: '', program: '', branch: '', year: '1'
  });
  const [addStudentLoading, setAddStudentLoading] = useState(false);
  const [studentBulkFile, setStudentBulkFile] = useState(null);
  const [studentBulkLoading, setStudentBulkLoading] = useState(false);
  const [studentBulkResult, setStudentBulkResult] = useState(null);
  const [addStudentSchools, setAddStudentSchools] = useState([]);
  const [addStudentPrograms, setAddStudentPrograms] = useState([]);
  const [addStudentBranches, setAddStudentBranches] = useState([]);

  // Student Accounts Filtering States
  const [filterSchoolId, setFilterSchoolId] = useState('');
  const [filterProgramId, setFilterProgramId] = useState('');
  const [filterBranchId, setFilterBranchId] = useState('');
  const [filterProgramsList, setFilterProgramsList] = useState([]);
  const [filterBranchesList, setFilterBranchesList] = useState([]);

  // Student Accounts Editing States
  const [editingStudent, setEditingStudent] = useState(null);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [editStudentForm, setEditStudentForm] = useState({
    full_name: '', roll_number: '', college_id: '', email: '',
    school: '', program: '', branch: '', year: '1', is_active: true
  });
  const [editStudentLoading, setEditStudentLoading] = useState(false);
  const [editStudentPrograms, setEditStudentPrograms] = useState([]);
  const [editStudentBranches, setEditStudentBranches] = useState([]);

  useEffect(() => {
    if (!editStudentForm.school) {
      setEditStudentPrograms([]);
      setEditStudentBranches([]);
      return;
    }
    getProgramsBySchool(editStudentForm.school)
      .then(data => setEditStudentPrograms(Array.isArray(data) ? data : []))
      .catch(() => setEditStudentPrograms([]));
  }, [editStudentForm.school]);

  useEffect(() => {
    if (!editStudentForm.program) {
      setEditStudentBranches([]);
      return;
    }
    getBranchesByProgram(editStudentForm.program)
      .then(data => setEditStudentBranches(Array.isArray(data) ? data : []))
      .catch(() => setEditStudentBranches([]));
  }, [editStudentForm.program]);

  const handleEditStudentSubmit = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      setEditStudentLoading(true);
      await updateAdminStudent(session?.token, editingStudent.id, { ...editStudentForm, college_id: editStudentForm.roll_number });
      showBeautifulPopup('Success', 'Student details updated successfully.', 'success');
      setShowEditStudentModal(false);
      setEditingStudent(null);
      fetchAllStudents();
    } catch (err) {
      const detail = err.data || {};
      const message = detail.detail || Object.values(detail).flat().join(' ') || 'Failed to update student details.';
      showBeautifulPopup('Error', message, 'error');
    } finally {
      setEditStudentLoading(false);
    }
  };

  const startEditStudent = (student) => {
    setEditingStudent(student);
    setEditStudentForm({
      full_name: student.full_name || '',
      roll_number: student.roll_number || '',
      college_id: student.college_id || '',
      email: student.email || '',
      school: student.school_id || '',
      program: student.program_id || '',
      branch: student.branch_id || '',
      year: student.year || '1',
      is_active: student.is_active !== false
    });
    setShowEditStudentModal(true);
  };

  // Student Accounts: Fetch all students
  const fetchAllStudents = async () => {
    try {
      setStudentsLoading(true);
      const data = await getAdminStudents(session?.token);
      setAllStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setStudentsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'Student Accounts') {
      fetchAllStudents();
      getSchools().then(data => setAddStudentSchools(Array.isArray(data) ? data : [])).catch(() => setAddStudentSchools([]));
    }
  }, [activeTab]);

  useEffect(() => {
    if (!addStudentForm.school) {
      setAddStudentPrograms([]);
      setAddStudentBranches([]);
      return;
    }
    getProgramsBySchool(addStudentForm.school)
      .then(data => setAddStudentPrograms(Array.isArray(data) ? data : []))
      .catch(() => setAddStudentPrograms([]));
  }, [addStudentForm.school]);

  useEffect(() => {
    if (!addStudentForm.program) {
      setAddStudentBranches([]);
      return;
    }
    getBranchesByProgram(addStudentForm.program)
      .then(data => setAddStudentBranches(Array.isArray(data) ? data : []))
      .catch(() => setAddStudentBranches([]));
  }, [addStudentForm.program]);

  // Initialize school filters and school presets for school admins
  useEffect(() => {
    if (activeTab === 'Student Accounts' && session?.user) {
      if (!session.user.is_super_admin && session.user.school_id) {
        const schId = session.user.school_id.toString();
        setFilterSchoolId(schId);
        setAddStudentForm(prev => ({ ...prev, school: schId }));
      }
    }
  }, [activeTab, session?.user]);

  // Load programs when filterSchoolId changes
  useEffect(() => {
    if (!filterSchoolId) {
      setFilterProgramsList([]);
      setFilterProgramId('');
      setFilterBranchId('');
      setFilterBranchesList([]);
      return;
    }
    getProgramsBySchool(filterSchoolId)
      .then(data => setFilterProgramsList(Array.isArray(data) ? data : []))
      .catch(() => setFilterProgramsList([]));
    setFilterProgramId('');
    setFilterBranchId('');
    setFilterBranchesList([]);
  }, [filterSchoolId]);

  // Load branches when filterProgramId changes
  useEffect(() => {
    if (!filterProgramId) {
      setFilterBranchesList([]);
      setFilterBranchId('');
      return;
    }
    getBranchesByProgram(filterProgramId)
      .then(data => setFilterBranchesList(Array.isArray(data) ? data : []))
      .catch(() => setFilterBranchesList([]));
    setFilterBranchId('');
  }, [filterProgramId]);

  const handleAddStudentSubmit = async (e) => {
    e.preventDefault();
    try {
      setAddStudentLoading(true);
      await createAdminStudent(session?.token, { ...addStudentForm, college_id: addStudentForm.roll_number });
      showBeautifulPopup('Success', 'Student account created successfully with default password (itmu@123).', 'success');
      setAddStudentForm({
        full_name: '', roll_number: '', college_id: '', email: '',
        school: !session?.user?.is_super_admin && session?.user?.school_id ? session.user.school_id.toString() : '',
        program: '', branch: '', year: '1'
      });
      setShowAddStudentForm(false);
      fetchAllStudents();
    } catch (err) {
      const detail = err.data || {};
      const message = detail.detail || Object.values(detail).flat().join(' ') || 'Failed to create student.';
      showBeautifulPopup('Error', message, 'error');
    } finally {
      setAddStudentLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    showBeautifulPopup(
      'Delete Student?',
      `Are you sure you want to delete "${studentName}"? This will remove their account and all associated data.`,
      'warning',
      async () => {
        try {
          await deleteAdminStudent(session?.token, studentId);
          showBeautifulPopup('Success', 'Student deleted successfully.', 'success');
          fetchAllStudents();
        } catch (err) {
          showBeautifulPopup('Error', err.message || 'Failed to delete student.', 'error');
        }
      },
      () => {},
      'Yes, Delete',
      'Cancel'
    );
  };

  const handleStudentBulkUpload = async (e) => {
    e.preventDefault();
    if (!studentBulkFile) return;
    try {
      setStudentBulkLoading(true);
      const result = await bulkUploadStudents(session?.token, studentBulkFile);
      setStudentBulkResult(result);
      setStudentBulkFile(null);
      const fileInput = document.getElementById('student-bulk-file-input');
      if (fileInput) fileInput.value = '';
      fetchAllStudents();
      showBeautifulPopup('Bulk Upload Complete', `${result.created} students created, ${result.skipped} skipped.`, result.created > 0 ? 'success' : 'warning');
    } catch (err) {
      showBeautifulPopup('Error', err.message || 'Bulk upload failed.', 'error');
    } finally {
      setStudentBulkLoading(false);
    }
  };

  const handleDownloadStudentTemplate = async () => {
    try {
      const blob = await downloadStudentTemplate(session?.token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'student_upload_template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      showBeautifulPopup('Error', 'Failed to download template.', 'error');
    }
  };
  const [manageQuestions, setManageQuestions] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showAddQuestionForm, setShowAddQuestionForm] = useState(false);
  const [newQuestionData, setNewQuestionData] = useState({
    text: '',
    question_type: 'regular',
    category: 'General',
    marks: 1,
    trivia: '',
    choices: [
      { text: '', is_correct: true, correct_order: null },
      { text: '', is_correct: false, correct_order: null },
      { text: '', is_correct: false, correct_order: null },
      { text: '', is_correct: false, correct_order: null }
    ]
  });

  const [questionSearchQuery, setQuestionSearchQuery] = useState('');
  const [questionTypeFilter, setQuestionTypeFilter] = useState('all');

  useEffect(() => {
    const isFFF = newQuestionData.question_type.startsWith('fff_');
    if (isFFF) {
      if (newQuestionData.choices.length < 8) {
        const needed = 8 - newQuestionData.choices.length;
        const extra = Array.from({ length: needed }, (_, i) => ({
          text: '',
          is_correct: false,
          correct_order: newQuestionData.choices.length + i + 1
        }));
        setNewQuestionData(prev => ({
          ...prev,
          choices: [...prev.choices, ...extra]
        }));
      }
    } else {
      if (newQuestionData.choices.length !== 4) {
        setNewQuestionData(prev => ({
          ...prev,
          choices: [
            { text: prev.choices[0]?.text || '', is_correct: true, correct_order: null },
            { text: prev.choices[1]?.text || '', is_correct: false, correct_order: null },
            { text: prev.choices[2]?.text || '', is_correct: false, correct_order: null },
            { text: prev.choices[3]?.text || '', is_correct: false, correct_order: null }
          ]
        }));
      }
    }
  }, [newQuestionData.question_type]);

  const isLight = theme === 'light';
  const admin = {
    name: session?.student?.full_name || 'Administrator',
    role: 'System Overseer',
  };

  const navigation = [
    { label: 'Overview', symbol: <OverviewIcon /> },
    { label: 'Manage Quizzes', symbol: <QuizzesIcon /> },
    ...(session?.user?.is_super_admin ? [{ label: 'Manage School Admins', symbol: <AdminsIcon /> }] : []),
    { label: 'Live KBC Controller', symbol: <KbcControllerIcon /> },
    { label: 'Quiz Enrollment', symbol: <EnrollmentIcon /> },
    { label: 'Student Accounts', symbol: <StudentsIcon /> },
    { label: 'System Settings', symbol: <SettingsIcon /> },
  ];

  // KBC Controller States
  const [selectedKbcQuizId, setSelectedKbcQuizId] = useState(null);
  const [kbcQuizDetail, setKbcQuizDetail] = useState(null);
  const [kbcLiveState, setKbcLiveState] = useState(null);
  const [prelimScoresList, setPrelimScoresList] = useState([]);
  const [fffResultsData, setFffResultsData] = useState(null);
  const [kbcLoading, setKbcLoading] = useState(false);
  const [batch1Input, setBatch1Input] = useState('');
  const [batch2Input, setBatch2Input] = useState('');
  const [batch3Input, setBatch3Input] = useState('');
  const [showManualStages, setShowManualStages] = useState(false);

  const targetBatchSize = (() => {
    if (kbcQuizDetail?.batch_1_players && kbcQuizDetail.batch_1_players.length > 0) {
      return kbcQuizDetail.batch_1_players.length;
    }
    const completedCount = prelimScoresList.filter(s => s.completed).length;
    if (completedCount === 0) return 10; // Default fallback
    const topCount = Math.round(completedCount * 0.30);
    const batchSize = Math.floor(topCount / 3);
    return Math.max(1, batchSize);
  })();


  // Manage Students States
  const [selectedEnrollQuizId, setSelectedEnrollQuizId] = useState('');
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [enrollForm, setEnrollForm] = useState({ fullName: '', email: '', rollNumber: '', paymentStatus: 'paid' });
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollFile, setEnrollFile] = useState(null);

  // System Settings States
  const [settingsForm, setSettingsForm] = useState({
    email: session?.user?.email || 'admin@quizverse.com',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  
  // Custom Live Event Configuration States stored in localStorage
  const [prelimDuration, setPrelimDuration] = useState(() => parseInt(localStorage.getItem('quizverse_cfg_prelim_duration') || '90'));
  const [fffDuration, setFffDuration] = useState(() => parseInt(localStorage.getItem('quizverse_cfg_fff_duration') || '20'));
  const [hotseatQ1Q5Duration, setHotseatQ1Q5Duration] = useState(() => parseInt(localStorage.getItem('quizverse_cfg_hotseat_q1_q5_duration') || '60'));
  const [hotseatQ6Q10Duration, setHotseatQ6Q10Duration] = useState(() => parseInt(localStorage.getItem('quizverse_cfg_hotseat_q6_q10_duration') || '120'));
  const [autoApproveEnrollment, setAutoApproveEnrollment] = useState(() => localStorage.getItem('quizverse_cfg_auto_approve_enrollment') === 'true');

  const fetchEnrolledStudents = async (quizId) => {
    if (!quizId) {
      setEnrolledStudents([]);
      return;
    }
    try {
      setEnrollLoading(true);
      const data = await getEnrolledStudents(quizId, session?.token);
      setEnrolledStudents(data || []);
    } catch (err) {
      console.error("Error fetching enrolled students:", err);
      alert(err.message || 'Failed to fetch enrolled students');
    } finally {
      setEnrollLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'Quiz Enrollment' && selectedEnrollQuizId) {
      fetchEnrolledStudents(selectedEnrollQuizId);
    }
  }, [activeTab, selectedEnrollQuizId]);

  useEffect(() => {
    if (activeTab === 'Quiz Enrollment' && quizzes.length > 0 && !selectedEnrollQuizId) {
      setSelectedEnrollQuizId(quizzes[0].id);
    }
  }, [activeTab, quizzes]);

  useEffect(() => {
    if (activeTab === 'System Settings') {
      getSystemPreferences(session?.token)
        .then((data) => {
          setPrelimDuration(data.prelim_mcq_timer);
          setFffDuration(data.fff_speed_timer);
          setHotseatQ1Q5Duration(data.hotseat_q1_q5_limit);
          setHotseatQ6Q10Duration(data.hotseat_q6_q10_limit);
          setAutoApproveEnrollment(data.auto_approve_registrations);
        })
        .catch((err) => {
          console.error("Failed to fetch system preferences:", err);
        });
    }
  }, [activeTab, session?.token]);

  const handleEnrollManualSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEnrollQuizId) {
      alert('Please select a quiz first.');
      return;
    }
    try {
      setEnrollLoading(true);
      const payload = {
        full_name: enrollForm.fullName,
        email: enrollForm.email,
        roll_number: enrollForm.rollNumber,
        college_id: enrollForm.rollNumber,
        payment_status: enrollForm.paymentStatus
      };
      const res = await enrollStudentManual(selectedEnrollQuizId, payload, session?.token);
      alert(res.detail || 'Student enrolled successfully!');
      setEnrollForm({ fullName: '', email: '', rollNumber: '', paymentStatus: 'paid' });
      fetchEnrolledStudents(selectedEnrollQuizId);
    } catch (err) {
      alert(err.message || 'Failed to enroll student manually');
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleBulkEnrollSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEnrollQuizId) {
      alert('Please select a quiz first.');
      return;
    }
    if (!enrollFile) {
      alert('Please select a CSV or XLSX file first.');
      return;
    }
    try {
      setEnrollLoading(true);
      const res = await bulkEnrollStudents(selectedEnrollQuizId, enrollFile, session?.token);
      alert(res.detail || 'Bulk enrollment completed!');
      setEnrollFile(null);
      const fileInput = document.getElementById('bulk-enroll-file-input');
      if (fileInput) fileInput.value = '';
      fetchEnrolledStudents(selectedEnrollQuizId);
    } catch (err) {
      alert(err.message || 'Failed to bulk enroll students');
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleSaveSettingsSubmit = async (e) => {
    e.preventDefault();
    if (settingsForm.newPassword && settingsForm.newPassword !== settingsForm.confirmNewPassword) {
      alert("New password and confirmation do not match.");
      return;
    }
    
    try {
      setSettingsLoading(true);
      const payload = {
        email: settingsForm.email
      };
      if (settingsForm.newPassword) {
        payload.password = settingsForm.newPassword;
        payload.current_password = settingsForm.currentPassword;
      }
      
      const res = await updateUserCredentials(session?.token, payload);
      
      const currentSession = getAuthSession();
      if (currentSession) {
        currentSession.user = {
          ...currentSession.user,
          email: res.user.email
        };
        saveAuthSession(currentSession);
      }
      
      setSettingsForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      }));
      
      alert(res.message || "Account settings updated successfully.");
    } catch (err) {
      console.error("Error updating settings:", err);
      alert(err.message || "Failed to update settings.");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        prelim_mcq_timer: prelimDuration,
        fff_speed_timer: fffDuration,
        hotseat_q1_q5_limit: hotseatQ1Q5Duration,
        hotseat_q6_q10_limit: hotseatQ6Q10Duration,
        auto_approve_registrations: autoApproveEnrollment,
      };
      await saveSystemPreferences(payload, session?.token);
      
      // Keep writing to localStorage as a local fallback / redundancy
      localStorage.setItem('quizverse_cfg_prelim_duration', prelimDuration.toString());
      localStorage.setItem('quizverse_cfg_fff_duration', fffDuration.toString());
      localStorage.setItem('quizverse_cfg_hotseat_q1_q5_duration', hotseatQ1Q5Duration.toString());
      localStorage.setItem('quizverse_cfg_hotseat_q6_q10_duration', hotseatQ6Q10Duration.toString());
      localStorage.setItem('quizverse_cfg_auto_approve_enrollment', autoApproveEnrollment.toString());
      
      alert("Live Event Preferences saved successfully.");
    } catch (err) {
      console.error("Error saving preferences:", err);
      alert(err.message || "Failed to save live preferences.");
    }
  };

  const handleResetLiveEventState = () => {
    showBeautifulPopup(
      "Reset Live Event State?",
      "Are you absolutely sure you want to reset the KBC live round states? This will reset all active hotseat attempts and fff speeds back to their zero marks.",
      "warning",
      () => {
        alert("KBC live stage state has been successfully reset across the cluster!");
      }
    );
  };

  const handleRemoveRegistration = async (registrationId, studentName) => {
    showBeautifulPopup(
      "Remove Registration?",
      `Are you sure you want to remove "${studentName}" from this quiz?\n\nThis will also delete their quiz attempt, answers, and FFF submissions. They will be able to re-register.`,
      "warning",
      async () => {
        try {
          setEnrollLoading(true);
          const res = await removeRegistration(selectedEnrollQuizId, registrationId, session?.token);
          showBeautifulPopup("Success", res.detail || 'Registration removed successfully.', "success");
          fetchEnrolledStudents(selectedEnrollQuizId);
        } catch (err) {
          showBeautifulPopup("Error", err.message || 'Failed to remove registration.', "error");
        } finally {
          setEnrollLoading(false);
        }
      },
      () => {},
      "Yes, Remove",
      "Cancel"
    );
  };

  const handleDownloadEnrollmentTemplate = async () => {
    try {
      setEnrollLoading(true);
      const blob = await downloadEnrollmentTemplate(session?.token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'student_enrollment_template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert(err.message || 'Failed to download student enrollment template');
    } finally {
      setEnrollLoading(false);
    }
  };

  const KBC_STAGES = [
    { value: 'regular', label: 'Preliminary Quiz' },
    { value: 'batch_selection', label: 'Batch Configuration' },
    { value: 'fff_batch_1', label: 'FFF — Batch 1' },
    { value: 'hotseat_batch_1', label: 'Hotseat — Batch 1' },
    { value: 'fff_batch_2', label: 'FFF — Batch 2' },
    { value: 'hotseat_batch_2', label: 'Hotseat — Batch 2' },
    { value: 'fff_batch_3', label: 'FFF — Batch 3' },
    { value: 'hotseat_batch_3', label: 'Hotseat — Batch 3' },
    { value: 'completed', label: 'Event Completed' }
  ];

  const KBC_PHASES = [
    { num: 1, label: 'Prelims', icon: <PrelimsIcon />, desc: 'Active preliminary MCQ round' },
    { num: 2, label: 'Batch Setup', icon: <SettingsIcon />, desc: 'Define FFF contestant groupings' },
    { num: 3, label: 'FFF Round', icon: <LightningIcon />, desc: 'Run FFF speed test' },
    { num: 4, label: 'Hotseat', icon: <MicrophoneIcon />, desc: 'Main KBC Game Arena live' },
    { num: 5, label: 'Concluded', icon: <TrophyIcon />, desc: 'View podium and final standings' }
  ];

  const getActivePhaseNum = (stage) => {
    if (!stage || stage === 'regular') return 1;
    if (stage === 'batch_selection') return 2;
    if (stage.startsWith('fff_')) return 3;
    if (stage.startsWith('hotseat_')) return 4;
    if (stage === 'completed') return 5;
    return 1;
  };

  const KBC_LADDER = [
    { q: 15, val: '1,00,00,000 pts', jackpot: true },
    { q: 14, val: '50,00,000 pts' },
    { q: 13, val: '25,00,000 pts' },
    { q: 12, val: '12,50,000 pts' },
    { q: 11, val: '6,40,000 pts' },
    { q: 10, val: '3,20,000 pts', checkpoint: true },
    { q: 9, val: '1,60,000 pts' },
    { q: 8, val: '80,000 pts' },
    { q: 7, val: '40,000 pts' },
    { q: 6, val: '20,000 pts' },
    { q: 5, val: '10,000 pts', checkpoint: true },
    { q: 4, val: '5,000 pts' },
    { q: 3, val: '3,000 pts' },
    { q: 2, val: '2,000 pts' },
    { q: 1, val: '1,000 pts' }
  ];

  const fetchKbcControllerData = async (quizId) => {
    if (!quizId) return;
    try {
      const token = session?.token;
      const detail = await getQuizDetails(quizId, token);
      setKbcQuizDetail(detail);

      // Fetch live-state (for hotseat attempt info)
      try {
        const liveState = await getQuizLiveState(quizId, token);
        setKbcLiveState(liveState);
      } catch (e) {
        console.error("Error fetching KBC live state:", e);
      }

      // Fetch prelim scores
      try {
        const scores = await getPrelimScores(quizId, token);
        setPrelimScoresList(scores);
      } catch (e) {
        console.error("Error fetching prelim scores:", e);
      }

      // Fetch FFF results if in FFF stage or Hotseat stage
      const stage = detail.current_stage;
      if (stage.startsWith('fff_') || stage.startsWith('hotseat_')) {
        try {
          const fffData = await getFFFResults(quizId, token);
          setFffResultsData(fffData);
        } catch (e) {
          console.error("Error fetching FFF results:", e);
          setFffResultsData(null);
        }
      } else {
        setFffResultsData(null);
      }


    } catch (err) {
      console.error("Error fetching KBC controller data:", err);
    }
  };

  // Poll live KBC controller data safely with recursive setTimeout to prevent network congestion
  useEffect(() => {
    let active = true;
    let timeoutId = null;

    const poll = async () => {
      if (!active) return;
      try {
        await fetchKbcControllerData(selectedKbcQuizId);
      } catch (err) {
        console.error("Overlapping admin poll error:", err);
      } finally {
        if (active) {
          // Schedule next poll ONLY after current request completes
          timeoutId = setTimeout(poll, 3000);
        }
      }
    };

    if (activeTab === 'Live KBC Controller' && selectedKbcQuizId) {
      poll();
    }

    return () => {
      active = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [activeTab, selectedKbcQuizId]);

  useEffect(() => {
    if (kbcQuizDetail) {
      setBatch1Input(kbcQuizDetail.batch_1_players?.join(', ') || '');
      setBatch2Input(kbcQuizDetail.batch_2_players?.join(', ') || '');
      setBatch3Input(kbcQuizDetail.batch_3_players?.join(', ') || '');
    }
  }, [kbcQuizDetail?.id]);

  const handleUpdateStage = async (stage) => {
    try {
      setKbcLoading(true);
      await updateQuizStage(selectedKbcQuizId, stage, session?.token);
      await fetchKbcControllerData(selectedKbcQuizId);
    } catch (err) {
      alert(err.message || 'Failed to update stage');
    } finally {
      setKbcLoading(false);
    }
  };


  const handleAutoGenerateBatches = async () => {
    try {
      setKbcLoading(true);
      await setQuizBatches(selectedKbcQuizId, [], [], [], session?.token);
      const data = await getQuizDetails(selectedKbcQuizId, session?.token);
      setKbcQuizDetail(data);
      setBatch1Input(data.batch_1_players?.join(', ') || '');
      setBatch2Input(data.batch_2_players?.join(', ') || '');
      setBatch3Input(data.batch_3_players?.join(', ') || '');
      alert(`Batches automatically configured with the top 30% of overall participants (divided into 3 equal batches of ${data.batch_1_players?.length || 0} contestants).`);
    } catch (err) {
      alert(err.message || 'Failed to auto-generate batches');
    } finally {
      setKbcLoading(false);
    }
  };

  const handleSaveBatches = async () => {
    try {
      setKbcLoading(true);
      const parseCsv = (str) => str.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x));
      const b1 = parseCsv(batch1Input);
      const b2 = parseCsv(batch2Input);
      const b3 = parseCsv(batch3Input);
      
      await setQuizBatches(selectedKbcQuizId, b1, b2, b3, session?.token);
      alert('Batches saved successfully.');
      await fetchKbcControllerData(selectedKbcQuizId);
    } catch (err) {
      alert(err.message || 'Failed to save batches');
    } finally {
      setKbcLoading(false);
    }
  };

  const handlePromoteToHotseat = async (studentId) => {
    try {
      setKbcLoading(true);
      await promoteToHotseat(selectedKbcQuizId, studentId, session?.token);
      alert('Student successfully promoted to Hotseat!');
      await fetchKbcControllerData(selectedKbcQuizId);
    } catch (err) {
      alert(err.message || 'Failed to promote student');
    } finally {
      setKbcLoading(false);
    }
  };

  const getNextStageValue = (current) => {
    const idx = KBC_STAGES.findIndex(s => s.value === current);
    if (idx !== -1 && idx < KBC_STAGES.length - 1) {
      return KBC_STAGES[idx + 1].value;
    }
    return null;
  };

  const getPrevStageValue = (current) => {
    const idx = KBC_STAGES.findIndex(s => s.value === current);
    if (idx > 0) {
      return KBC_STAGES[idx - 1].value;
    }
    return null;
  };

  const getHostGuide = (stage) => {
    switch (stage) {
      case 'regular':
        return {
          title: "Preliminary MCQ Round",
          desc: "All students are answering preliminary MCQ questions on their screens.",
          actions: [
            "Monitor live standings in the leaderboard table on the right.",
            "Verify that contestant scores and answers are registering.",
            "Once students have completed their preliminary round, click 'Advance Event Phase' below to proceed to Batch Configuration."
          ],
          nextLabel: "Batch Configuration"
        };
      case 'batch_selection':
        return {
          title: "FFF Batch Setup",
          desc: "Group the top 30% of preliminary scorers into 3 equal batches for FFF rounds.",
          actions: [
            "Click '⚡ Auto-Generate Batches' to group the top 30% of scorers into equal batches.",
            "Adjust user IDs manually if desired, then click '💾 Lock & Save Batches'.",
            "When batches are locked, click 'Advance Event Phase' below to start FFF Batch 1."
          ],
          nextLabel: "FFF — Batch 1"
        };
      case 'fff_batch_1':
      case 'fff_batch_2':
      case 'fff_batch_3':
        const fffNum = stage.slice(-1);
        return {
          title: `Fastest Finger First — Batch ${fffNum}`,
          desc: `Contestants in FFF Batch ${fffNum} are competing to arrange options in correct sequence.`,
          actions: [
            "Ensure the active FFF question is displayed on contestants' screens.",
            "Await sorting submissions. The fastest correct contestant will be highlighted with a crown 👑 in the standings table.",
            "Click 'Promote' next to the winner's name, then click 'Advance Event Phase' to start the Hotseat round!"
          ],
          nextLabel: `Hotseat — Batch ${fffNum}`
        };
      case 'hotseat_batch_1':
      case 'hotseat_batch_2':
      case 'hotseat_batch_3':
        const hsNum = stage.slice(-1);
        return {
          title: `Hotseat Arena — Batch ${hsNum}`,
          desc: `The active contestant is sitting on the Hotseat playing the main KBC game live!`,
          actions: [
            "Click '🎙️ ENTER HOST ARENA' to open the Broadcast Controller in a new full-screen tab.",
            "Run the live show from that tab (play intro, read trivia, reveal options, lock choices).",
            "When the hotseat run ends, return here and click 'Advance Event Phase' below to proceed to the next round."
          ],
          nextLabel: hsNum === '3' ? "Event Completed" : `FFF — Batch ${parseInt(hsNum) + 1}`
        };
      case 'completed':
        return {
          title: "Event Concluded",
          desc: "The KBC Live Event has successfully finished!",
          actions: [
            "Review the final standings on the podium on the right.",
            "Highlight the top scorers and crown the grand champion!",
            "You can now safely exit the console or select another event."
          ],
          nextLabel: null
        };
      default:
        return {
          title: "KBC Live Stage",
          desc: "Manage the active live event stage.",
          actions: ["Navigate stages sequentially using the controls below."],
          nextLabel: "Next Stage"
        };
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      if (session?.token) {
        const [qData, sData, studentsData] = await Promise.all([
          getAdminQuizzes(session.token),
          getAdminStats(session.token),
          getAdminStudents(session.token).catch(() => [])
        ]);
        setQuizzes(qData);
        setAdminStats(sData);
        setAllStudents(Array.isArray(studentsData) ? studentsData : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    getSchools().then(data => setSchools(Array.isArray(data) ? data : [])).catch(() => setSchools([]));
  }, []);

  useEffect(() => {
    if (session?.token) {
      getSchoolAdmins(session.token)
        .then(data => setAdminsList(Array.isArray(data) ? data : []))
        .catch(() => setAdminsList([]));
    }
  }, [session?.token]);

  useEffect(() => {
    if (!formData.eligibility_school) {
      setPrograms([]);
      setBranches([]);
      return;
    }
    getProgramsBySchool(formData.eligibility_school)
      .then(data => setPrograms(Array.isArray(data) ? data : []))
      .catch(() => setPrograms([]));
  }, [formData.eligibility_school]);

  useEffect(() => {
    if (!formData.eligibility_programs || formData.eligibility_programs.length === 0) {
      setBranches([]);
      return;
    }
    Promise.all(formData.eligibility_programs.map(pid => getBranchesByProgram(pid)))
      .then(results => {
        const allBranches = results.flat();
        setBranches(allBranches);
      })
      .catch(() => setBranches([]));
  }, [formData.eligibility_programs]);

  const toggleQuizSetting = async (quizId, field, currentValue) => {
    try {
      await updateAdminQuiz(quizId, { [field]: !currentValue }, session?.token);
      await fetchDashboardData();
    } catch (err) {
      alert('Failed to update quiz setting');
    }
  };

  const handleCreateNewClick = () => {
    setEditingQuizId(null);
    setFormData({
      title: '', description: '', rules_instructions: '', 
      event_date: '', event_time: '',
      registration_open_date: '', registration_open_time: '', 
      registration_close_date: '', registration_close_time: '', 
      max_participants: '100',
      registration_fee: '0', visible_to_students: false, is_registration_open: false,
      intro_title: 'Kaun Banega Crorepati',
      require_eligibility: false,
      eligibility_school: session?.user?.school_id || '',
      eligibility_programs: [],
      eligibility_branches: [],
      host: ''
    });
    setShowModal(true);
  };

  const handleEditClick = (quiz) => {
    setEditingQuizId(quiz.id);
    
    const splitDateTime = (isoString) => {
      if (!isoString) return { date: '', time: '' };
      try {
        const d = new Date(isoString);
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
        return {
          date: local.split('T')[0],
          time: local.split('T')[1].substring(0,5)
        };
      } catch(e) { return { date: '', time: '' }; }
    }

    const event = splitDateTime(quiz.event_date);
    const regOpen = splitDateTime(quiz.registration_open_date);
    const regClose = splitDateTime(quiz.registration_close_date);

    setFormData({
      title: quiz.title || '',
      description: quiz.description || '',
      rules_instructions: quiz.rules_instructions || '',
      event_date: event.date,
      event_time: event.time,
      registration_open_date: regOpen.date,
      registration_open_time: regOpen.time,
      registration_close_date: regClose.date,
      registration_close_time: regClose.time,
      max_participants: quiz.max_participants ? quiz.max_participants.toString() : '',
      registration_fee: quiz.registration_fee ? quiz.registration_fee.toString() : '0',
      visible_to_students: quiz.visible_to_students || false,
      is_registration_open: quiz.is_registration_open || false,
      intro_title: quiz.intro_title || 'Kaun Banega Crorepati',
      require_eligibility: !!(quiz.allowed_schools?.length || quiz.allowed_programs?.length || quiz.allowed_branches?.length),
      eligibility_school: quiz.allowed_schools?.[0] || session?.user?.school_id || '',
      eligibility_programs: quiz.allowed_programs || [],
      eligibility_branches: quiz.allowed_branches || [],
      host: quiz.host || ''
    });
    
    setShowModal(true);
  };

  const handleDeleteClick = async (quizId) => {
    showBeautifulPopup(
      "Delete Quiz?",
      "Are you sure you want to completely delete this quiz? This action cannot be undone.",
      "warning",
      async () => {
        try {
          await deleteAdminQuiz(quizId, session?.token);
          await fetchDashboardData();
          showBeautifulPopup("Success", 'Quiz deleted successfully.', "success");
        } catch (err) {
          showBeautifulPopup("Error", 'Failed to delete quiz.', "error");
        }
      },
      () => {},
      "Delete",
      "Cancel"
    );
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    if (!adminForm.full_name || !adminForm.email || !adminForm.college_id || (!editingAdminId && !adminForm.password)) {
      alert("Name, email, college ID, and password are required.");
      return;
    }
    try {
      setAdminSubmitLoading(true);
      if (editingAdminId) {
        await updateSchoolAdmin(session?.token, editingAdminId, adminForm);
        alert("Admin updated successfully.");
      } else {
        await createSchoolAdmin(session?.token, adminForm);
        alert("Admin created successfully.");
      }
      const data = await getSchoolAdmins(session?.token);
      setAdminsList(Array.isArray(data) ? data : []);
      setAdminForm({ full_name: '', email: '', college_id: '', password: '', school_id: '', is_super_admin: false });
      setEditingAdminId(null);
    } catch (err) {
      alert(err.data?.detail || err.message || "Failed to save admin user.");
    } finally {
      setAdminSubmitLoading(false);
    }
  };

  const handleAdminEditClick = (adm) => {
    setEditingAdminId(adm.id);
    setAdminForm({
      full_name: adm.full_name || '',
      email: adm.email || '',
      college_id: adm.college_id || '',
      password: '',
      school_id: adm.school_id || '',
      is_super_admin: adm.is_super_admin || false
    });
  };

  const handleAdminDeleteClick = async (adminId) => {
    showBeautifulPopup(
      "Delete Admin?",
      "Are you sure you want to completely delete this admin account? This action cannot be undone.",
      "warning",
      async () => {
        try {
          await deleteSchoolAdmin(session?.token, adminId);
          const data = await getSchoolAdmins(session?.token);
          setAdminsList(Array.isArray(data) ? data : []);
          showBeautifulPopup("Success", 'Admin deleted successfully.', "success");
        } catch (err) {
          showBeautifulPopup("Error", err.data?.detail || err.message || 'Failed to delete admin.', "error");
        }
      }
    );
  };

  const handleDownloadTemplate = async (type = 'prelim') => {
    try {
      const res = await fetch(`${API_BASE_URL}/quizzes/admin/download_template/?type=${type}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${session?.token}` },
      });
      
      if (!res.ok) throw new Error('Failed to download template');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quiz_template_${type}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDownloadDetailedReport = async (quizId, quizTitle) => {
    try {
      const res = await fetch(`${API_BASE_URL}/quizzes/${quizId}/detailed-report/`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${session?.token}` },
      });
      if (!res.ok) {
        throw new Error('Failed to generate report.');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `KBC_Detailed_Report_${quizTitle.replace(/\s+/g, '_')}_${quizId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || 'Error downloading performance report.');
    }
  };

  const handleRequestGlobalEvent = async (quiz) => {
    showBeautifulPopup(
      "Request Global Event?",
      "Would you like to submit a request to the Super Admin to promote this quiz event to a Global Event visible to all schools?",
      "info",
      async () => {
        try {
          const updatedDesc = `${quiz.description || ''}\n\n[SYSTEM_GLOBAL_REQUEST]`.trim();
          await updateAdminQuiz(quiz.id, { description: updatedDesc }, session?.token);
          await fetchDashboardData();
          showBeautifulPopup("Success", "Request sent successfully to the Super Admin!", "success");
        } catch (err) {
          showBeautifulPopup("Error", err.message || "Failed to send request.", "error");
        }
      }
    );
  };

  const handleApproveGlobalEvent = async (quiz) => {
    showBeautifulPopup(
      "Approve Global Event?",
      "Are you sure you want to promote this event to a Global Event? It will be made visible and accessible to all schools.",
      "warning",
      async () => {
        try {
          const updatedDesc = (quiz.description || '').replace('[SYSTEM_GLOBAL_REQUEST]', '').trim();
          await updateAdminQuiz(quiz.id, { description: updatedDesc, allowed_schools: [] }, session?.token);
          await fetchDashboardData();
          showBeautifulPopup("Success", "Event promoted to Global Event successfully!", "success");
        } catch (err) {
          showBeautifulPopup("Error", err.message || "Failed to approve global event.", "error");
        }
      }
    );
  };

  const handleUploadExcel = async (quizId, file) => {
    try {
      const formDataObj = new FormData();
      formDataObj.append('file', file);
      
      const res = await fetch(`${API_BASE_URL}/quizzes/admin/${quizId}/upload_questions/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.token}` },
        body: formDataObj
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Upload failed');
      
      setUploadResult(data);
      await fetchDashboardData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleManageQuestionsClick = async (quiz) => {
    try {
      const res = await fetch(`${API_BASE_URL}/quizzes/admin/${quiz.id}/questions/`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${session?.token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to fetch questions');
      
      setManageQuestions(data);
      setSelectedManageQuiz(quiz);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    showBeautifulPopup(
      "Delete Question?",
      "Are you sure you want to delete this question? This action cannot be undone.",
      "warning",
      async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/quizzes/admin/delete_question/`, {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${session?.token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: questionId })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.detail || 'Failed to delete question');
          
          if (selectedManageQuiz) {
            await handleManageQuestionsClick(selectedManageQuiz);
            await fetchDashboardData();
          }
        } catch (err) {
          showBeautifulPopup("Error", err.message, "error");
        }
      },
      () => {},
      "Delete",
      "Cancel"
    );
  };

  const handleAddQuestionSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/quizzes/admin/${selectedManageQuiz.id}/add_question/`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${session?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newQuestionData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to add question');
      
      alert('Question added successfully!');
      setNewQuestionData({
        text: '',
        question_type: 'regular',
        category: 'General',
        marks: 1,
        trivia: '',
        choices: [
          { text: '', is_correct: true, correct_order: null },
          { text: '', is_correct: false, correct_order: null },
          { text: '', is_correct: false, correct_order: null },
          { text: '', is_correct: false, correct_order: null }
        ]
      });
      setShowAddQuestionForm(false);
      await handleManageQuestionsClick(selectedManageQuiz);
      await fetchDashboardData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditQuestionClick = (question) => {
    setEditingQuestion(question);
    setNewQuestionData({
      id: question.id,
      text: question.text,
      question_type: question.question_type,
      category: question.category,
      marks: question.marks,
      trivia: question.trivia,
      choices: question.choices.map(c => ({
        text: c.text,
        is_correct: c.is_correct,
        correct_order: c.correct_order
      }))
    });
  };

  const handleEditQuestionSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/quizzes/admin/edit_question/`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${session?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newQuestionData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to update question');
      
      alert('Question updated successfully!');
      setEditingQuestion(null);
      setNewQuestionData({
        text: '',
        question_type: 'regular',
        category: 'General',
        marks: 1,
        trivia: '',
        choices: [
          { text: '', is_correct: true, correct_order: null },
          { text: '', is_correct: false, correct_order: null },
          { text: '', is_correct: false, correct_order: null },
          { text: '', is_correct: false, correct_order: null }
        ]
      });
      await handleManageQuestionsClick(selectedManageQuiz);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleManageSwitchCategoriesClick = async (quiz) => {
    try {
      setLoadingSwitchCategories(true);
      setShowSwitchCategoryPanel(true);
      const list = await getAdminSwitchCategories(quiz.id, session?.token);
      setAdminSwitchCategories(list);
    } catch (err) {
      alert(err.message || 'Failed to fetch switch categories');
    } finally {
      setLoadingSwitchCategories(false);
    }
  };

  const handleSaveSwitchCategorySubmit = async (e) => {
    e.preventDefault();
    console.log("handleSaveSwitchCategorySubmit triggered.");
    console.log("selectedManageQuiz:", selectedManageQuiz);
    console.log("editingSwitchCategory:", editingSwitchCategory);
    console.log("switchCategoryForm:", switchCategoryForm);
    
    if (!selectedManageQuiz) {
      alert("No quiz selected to manage switch categories.");
      return;
    }
    
    if (!editingSwitchCategory && adminSwitchCategories.length >= 6) {
      alert("A maximum of 6 switch categories is allowed.");
      return;
    }
    
    try {
      setSavingCategory(true);
      const formData = new FormData();
      if (editingSwitchCategory) {
        formData.append('category_id', editingSwitchCategory.id);
        console.log("Appended category_id:", editingSwitchCategory.id);
      }
      formData.append('name', switchCategoryForm.name || '');
      formData.append('question_text', switchCategoryForm.question_text || '');
      formData.append('choice_a', switchCategoryForm.choice_a || '');
      formData.append('choice_b', switchCategoryForm.choice_b || '');
      formData.append('choice_c', switchCategoryForm.choice_c || '');
      formData.append('choice_d', switchCategoryForm.choice_d || '');
      formData.append('correct_choice', switchCategoryForm.correct_choice || 'A');
      if (switchCategoryForm.image) {
        formData.append('image', switchCategoryForm.image);
        console.log("Appended new image file.");
      }
      
      console.log("Saving switch category via API...");
      const res = await saveAdminSwitchCategory(selectedManageQuiz.id, formData, session?.token);
      console.log("API response received:", res);
      alert('Switch Category and Question saved successfully!');
      
      setEditingSwitchCategory(null);
      setSwitchCategoryForm({
        name: '',
        question_text: '',
        choice_a: '',
        choice_b: '',
        choice_c: '',
        choice_d: '',
        correct_choice: 'A',
        image: null
      });
      
      console.log("Reloading switch categories...");
      const list = await getAdminSwitchCategories(selectedManageQuiz.id, session?.token);
      setAdminSwitchCategories(list);
      console.log("Switch categories reloaded successfully:", list);
    } catch (err) {
      console.error("Error inside handleSaveSwitchCategorySubmit:", err);
      alert(err.message || 'Failed to save switch category');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteSwitchCategory = async (categoryId) => {
    if (!selectedManageQuiz) return;
    if (!window.confirm('Are you sure you want to delete this switch category?')) return;
    
    try {
      await deleteAdminSwitchCategory(selectedManageQuiz.id, categoryId, session?.token);
      alert('Switch Category deleted successfully!');
      
      const list = await getAdminSwitchCategories(selectedManageQuiz.id, session?.token);
      setAdminSwitchCategories(list);
      
      if (editingSwitchCategory && editingSwitchCategory.id === categoryId) {
        setEditingSwitchCategory(null);
        setSwitchCategoryForm({
          name: '',
          question_text: '',
          choice_a: '',
          choice_b: '',
          choice_c: '',
          choice_d: '',
          correct_choice: 'A',
          image: null
        });
      }
    } catch (err) {
      alert(err.message || 'Failed to delete category');
    }
  };

  const handleTriggerIntro = async () => {
    try {
      await hostTriggerIntro(selectedKbcQuizId, session?.token);
      alert("KBC Intro triggered simultaneously for all screens!");
      await fetchKbcControllerData(selectedKbcQuizId);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCompleteIntro = async () => {
    try {
      await hostCompleteIntro(selectedKbcQuizId, session?.token);
      alert("Intro playback completed. Game board active!");
      await fetchKbcControllerData(selectedKbcQuizId);
    } catch (err) {
      alert(err.message);
    }
  };

  const submitQuiz = async (isDraft) => {
    try {
      if (!formData.eligibility_branches || formData.eligibility_branches.length === 0) {
        alert("Please select at least one Target Branch.");
        return;
      }
      setSubmitLoading(true);
      const payload = { ...formData };
      
      if (isDraft) {
        payload.visible_to_students = false;
        payload.is_registration_open = false;
      }

      if (payload.event_date && payload.event_time) {
        payload.event_date = `${payload.event_date}T${payload.event_time}:00`;
      } else {
        payload.event_date = null;
      }
      delete payload.event_time;

      if (payload.registration_open_date && payload.registration_open_time) {
        payload.registration_open_date = `${payload.registration_open_date}T${payload.registration_open_time}:00`;
      } else {
        payload.registration_open_date = null;
      }
      delete payload.registration_open_time;

      if (payload.registration_close_date && payload.registration_close_time) {
        payload.registration_close_date = `${payload.registration_close_date}T${payload.registration_close_time}:00`;
      } else {
        payload.registration_close_date = null;
      }
      delete payload.registration_close_time;
      
      payload.max_participants = payload.max_participants ? parseInt(payload.max_participants) : null;
      payload.registration_fee = payload.registration_fee ? parseFloat(payload.registration_fee) : 0.00;
      
      payload.allowed_schools = payload.eligibility_school ? [payload.eligibility_school] : [];
      payload.allowed_programs = payload.eligibility_programs || [];
      payload.allowed_branches = payload.eligibility_branches || [];
      delete payload.require_eligibility;
      delete payload.eligibility_school;
      delete payload.eligibility_programs;
      delete payload.eligibility_branches;

      // Remove optional empty string fields to bypass strict backend format validations, but preserve nulls
      Object.keys(payload).forEach(key => {
        if (payload[key] === '') {
          payload[key] = null;
        }
      });
      
      console.log('Sending payload:', payload);

      if (editingQuizId) {
        await updateAdminQuiz(editingQuizId, payload, session?.token);
        alert('Quiz updated successfully!');
      } else {
        await createAdminQuiz(payload, session?.token);
        alert(isDraft ? 'Draft saved successfully!' : 'Quiz created successfully!');
      }
      
      await fetchDashboardData();
      setShowModal(false);
    } catch (err) {
      console.error('Quiz Creation Error:', err, err.data);
      const errorData = err.data;
      if (errorData && typeof errorData === 'object' && Object.keys(errorData).length > 0 && !errorData.detail) {
        const messages = Object.entries(errorData).map(([key, val]) => {
          const stringVal = Array.isArray(val) ? val.join(' ') : (typeof val === 'object' ? JSON.stringify(val) : val);
          return `${key}: ${stringVal}`;
        });
        alert(`Validation Error:\n${messages.join('\n')}`);
      } else {
        alert(err.data?.detail || err.message || 'Failed to create quiz');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCreateQuiz = (e) => {
    e.preventDefault();
    submitQuiz(false);
  };

  const handleSaveDraft = (e) => {
    e.preventDefault();
    submitQuiz(true);
  };

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    localStorage.setItem('quizverse-theme', theme);
  }, [theme]);

  const handlePointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 28;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 28;

    setCoreOffset({ x, y });
  };

  return (
    <main
      className={`admin-dashboard-page kbc-broadcast theme-dark ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}
      style={{ '--core-x': `${coreOffset.x}px`, '--core-y': `${coreOffset.y}px` }}
      onPointerMove={handlePointerMove}
    >
      <div className="admin-dashboard-background" aria-hidden="true">
        <KbcStageFx intensity="lite" />
        <div className="admin-orb admin-orb-primary" />
        <div className="admin-orb admin-orb-secondary" />
        <div className="admin-grid" />
        <div className="admin-particles" />
      </div>

      <aside className={`admin-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`} aria-label="Dashboard navigation">
        <div className="admin-sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: isSidebarCollapsed ? 'center' : 'space-between', width: '100%', gap: '0.5rem', minHeight: '56px' }}>
          <Link className="admin-brand" to="/" style={{ gap: isSidebarCollapsed ? '0' : '0.85rem', display: 'flex', alignItems: 'center', minHeight: 'auto', padding: 0 }}>
            <span className="admin-brand-logo">{SYMBOLS.triangle}</span>
            {!isSidebarCollapsed && <span className="admin-brand-text" style={{ whiteSpace: 'nowrap' }}>QuizVerse Admin</span>}
          </Link>
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="admin-sidebar-toggle"
            type="button"
            aria-label="Toggle Sidebar"
            style={{
              background: 'rgba(212, 175, 55, 0.05)',
              border: '1px solid rgba(212, 175, 55, 0.15)',
              color: 'var(--admin-muted)',
              cursor: 'pointer',
              fontSize: '1rem',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
              padding: 0,
              flexShrink: 0
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = 'var(--admin-text)';
              e.currentTarget.style.background = 'rgba(212, 175, 55, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = 'var(--admin-muted)';
              e.currentTarget.style.background = 'rgba(212, 175, 55, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.15)';
            }}
          >
            {isSidebarCollapsed ? '›' : '‹'}
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          {navigation.map((item) => (
            <button 
              className={`admin-sidebar-item ${activeTab === item.label ? 'active' : ''}`} 
              key={item.label} 
              type="button"
              onClick={() => setActiveTab(item.label)}
              title={isSidebarCollapsed ? item.label : ''}
              style={{
                padding: isSidebarCollapsed ? '0' : '0 1rem',
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                gap: isSidebarCollapsed ? '0' : '0.9rem'
              }}
            >
              <span className="admin-sidebar-icon">{item.symbol}</span>
              {!isSidebarCollapsed && <span className="admin-sidebar-label">{item.label}</span>}
              {!isSidebarCollapsed && <span className="admin-sidebar-hover-symbol">{item.symbol}</span>}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer" style={{ marginTop: 'auto', borderTop: '1px solid var(--admin-border)', paddingTop: '1.5rem', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Link 
            to="/login" 
            className="admin-sidebar-item" 
            title={isSidebarCollapsed ? 'LOGOUT' : ''}
            style={{ 
              textDecoration: 'none', 
              border: '1px solid rgba(255, 107, 107, 0.25)', 
              background: 'rgba(255, 107, 107, 0.03)',
              borderRadius: '8px',
              padding: isSidebarCollapsed ? '0' : '0 1rem',
              justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
              gap: isSidebarCollapsed ? '0' : '0.9rem',
              minHeight: '50px',
              width: isSidebarCollapsed ? '50px' : '100%',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 107, 107, 0.7)';
              e.currentTarget.style.background = 'rgba(255, 107, 107, 0.08)';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 107, 107, 0.25)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 107, 107, 0.25)';
              e.currentTarget.style.background = 'rgba(255, 107, 107, 0.03)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <span className="admin-sidebar-icon" style={{ color: '#ff6b6b' }}><LogoutIcon /></span>
            {!isSidebarCollapsed && <span className="admin-sidebar-label" style={{ color: '#ff6b6b', fontWeight: '900', letterSpacing: '0.07em' }}>LOGOUT</span>}
            {!isSidebarCollapsed && <span className="admin-sidebar-hover-symbol" style={{ color: '#ff6b6b' }}><LogoutIcon /></span>}
          </Link>
        </div>
      </aside>

      <section className="admin-shell">
        <header className="admin-topbar">
          <div>
            <p className="admin-welcome-kicker">Welcome back, {admin.name}</p>
            <h1>{admin.role} {SYMBOLS.dot} Main Facility</h1>
          </div>
        </header>

        {activeTab === 'Overview' && (() => {
          // Dynamically compute student year ratios for premium demographics bar charts
          const year1Count = allStudents.filter(s => String(s.year) === '1').length;
          const year2Count = allStudents.filter(s => String(s.year) === '2').length;
          const year3Count = allStudents.filter(s => String(s.year) === '3').length;
          const year4Count = allStudents.filter(s => String(s.year) === '4').length;
          const maxCount = Math.max(year1Count, year2Count, year3Count, year4Count, 1);
          
          return (
            <>
              {/* Premium 4-Card Stats Grid */}
              <section className="admin-metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Card 1: Students */}
                {session?.user?.is_super_admin ? (
                  <article className="admin-metric-card tilt-card metric-mint" 
                    onClick={() => setActiveTab('Student Accounts')}
                    style={{ background: 'rgba(10, 17, 69, 0.45)', border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 8px 32px 0 rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)', cursor: 'pointer' }}
                  >
                    <div className="metric-header" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.75rem' }}>
                      <span style={{ background: 'rgba(21, 101, 192, 0.15)', color: '#42a5f5', padding: '0.4rem', borderRadius: '8px', width: '38px', height: '38px', display: 'grid', placeItems: 'center' }}><StudentsIcon size={24} /></span>
                      <h2 style={{ margin: 0, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-muted)' }}>Registered Students</h2>
                    </div>
                    <div className="metric-value" style={{ fontSize: '2.5rem', fontWeight: '900', color: '#fff' }}>{adminStats.total_students}</div>
                    <div className="metric-footer" style={{ fontSize: '0.8rem', color: '#42a5f5', marginTop: '0.5rem', fontFamily: 'monospace' }}>Verified Profiles</div>
                  </article>
                ) : (
                  <article className="admin-metric-card tilt-card metric-mint" 
                    onClick={() => setActiveTab('Student Accounts')}
                    style={{ background: 'rgba(10, 17, 69, 0.45)', border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 8px 32px 0 rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)', cursor: 'pointer' }}
                  >
                    <div className="metric-header" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.75rem' }}>
                      <span style={{ background: 'rgba(21, 101, 192, 0.15)', color: '#42a5f5', padding: '0.4rem', borderRadius: '8px', width: '38px', height: '38px', display: 'grid', placeItems: 'center' }}><StudentsIcon size={24} /></span>
                      <h2 style={{ margin: 0, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-muted)' }}>My School Students</h2>
                    </div>
                    <div className="metric-value" style={{ fontSize: '2.5rem', fontWeight: '900', color: '#fff' }}>
                      {allStudents.filter(s => String(s.school_id) === String(session?.user?.school_id)).length}
                    </div>
                    <div className="metric-footer" style={{ fontSize: '0.8rem', color: '#42a5f5', marginTop: '0.5rem', fontFamily: 'monospace' }}>School pre-registrations</div>
                  </article>
                )}

                {/* Card 2: Quizzes */}
                {session?.user?.is_super_admin ? (
                  <article className="admin-metric-card tilt-card metric-pink" 
                    onClick={() => setActiveTab('Manage Quizzes')}
                    style={{ background: 'rgba(10, 17, 69, 0.45)', border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 8px 32px 0 rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)', cursor: 'pointer' }}
                  >
                    <div className="metric-header" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.75rem' }}>
                      <span style={{ background: 'rgba(255, 179, 0, 0.15)', color: '#ffd54f', padding: '0.4rem', borderRadius: '8px', width: '38px', height: '38px', display: 'grid', placeItems: 'center' }}><TrophyIcon size={24} /></span>
                      <h2 style={{ margin: 0, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-muted)' }}>Total Quiz Events</h2>
                    </div>
                    <div className="metric-value" style={{ fontSize: '2.5rem', fontWeight: '900', color: '#fff' }}>{adminStats.total_quizzes}</div>
                    <div className="metric-footer" style={{ fontSize: '0.8rem', color: '#ffd54f', marginTop: '0.5rem', fontFamily: 'monospace' }}>{adminStats.active_quizzes} Published</div>
                  </article>
                ) : (
                  <article className="admin-metric-card tilt-card metric-pink" 
                    onClick={() => setActiveTab('Manage Quizzes')}
                    style={{ background: 'rgba(10, 17, 69, 0.45)', border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 8px 32px 0 rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)', cursor: 'pointer' }}
                  >
                    <div className="metric-header" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.75rem' }}>
                      <span style={{ background: 'rgba(255, 179, 0, 0.15)', color: '#ffd54f', padding: '0.4rem', borderRadius: '8px', width: '38px', height: '38px', display: 'grid', placeItems: 'center' }}><TrophyIcon size={24} /></span>
                      <h2 style={{ margin: 0, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-muted)' }}>My School Quizzes</h2>
                    </div>
                    <div className="metric-value" style={{ fontSize: '2.5rem', fontWeight: '900', color: '#fff' }}>
                      {quizzes.filter(q => !q.allowed_schools || q.allowed_schools.length === 0 || q.allowed_schools.some(schId => String(schId) === String(session?.user?.school_id))).length}
                    </div>
                    <div className="metric-footer" style={{ fontSize: '0.8rem', color: '#ffd54f', marginTop: '0.5rem', fontFamily: 'monospace' }}>Accessible arenas</div>
                  </article>
                )}

                {/* Card 3: Registrations / Admins */}
                {session?.user?.is_super_admin ? (
                  <article className="admin-metric-card tilt-card metric-yellow" style={{ background: 'rgba(10, 17, 69, 0.45)', border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 8px 32px 0 rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)' }}>
                    <div className="metric-header" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.75rem' }}>
                      <span style={{ background: 'rgba(255, 213, 79, 0.15)', color: '#ffb300', padding: '0.4rem', borderRadius: '8px', width: '38px', height: '38px', display: 'grid', placeItems: 'center' }}><EnrollmentIcon size={24} /></span>
                      <h2 style={{ margin: 0, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-muted)' }}>Contestant Registrations</h2>
                    </div>
                    <div className="metric-value" style={{ fontSize: '2.5rem', fontWeight: '900', color: '#fff' }}>{adminStats.total_registrations}</div>
                    <div className="metric-footer" style={{ fontSize: '0.8rem', color: '#ffb300', marginTop: '0.5rem', fontFamily: 'monospace' }}>Across all arenas</div>
                  </article>
                ) : (
                  <article className="admin-metric-card tilt-card metric-yellow" style={{ background: 'rgba(10, 17, 69, 0.45)', border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 8px 32px 0 rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)' }}>
                    <div className="metric-header" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.75rem' }}>
                      <span style={{ background: 'rgba(255, 213, 79, 0.15)', color: '#ffb300', padding: '0.4rem', borderRadius: '8px', width: '38px', height: '38px', display: 'grid', placeItems: 'center' }}><AdminsIcon size={24} /></span>
                      <h2 style={{ margin: 0, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-muted)' }}>My School Admins</h2>
                    </div>
                    <div className="metric-value" style={{ fontSize: '2.5rem', fontWeight: '900', color: '#fff' }}>
                      {adminsList.filter(adm => String(adm.school_id) === String(session?.user?.school_id)).length}
                    </div>
                    <div className="metric-footer" style={{ fontSize: '0.8rem', color: '#ffb300', marginTop: '0.5rem', fontFamily: 'monospace' }}>School staff accounts</div>
                  </article>
                )}

                {/* Card 4: Portal Affiliation / Platform Admins */}
                {session?.user?.is_super_admin ? (
                  <article className="admin-metric-card tilt-card metric-cyan" style={{ background: 'rgba(10, 17, 69, 0.45)', border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 8px 32px 0 rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)' }}>
                    <div className="metric-header" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.75rem' }}>
                      <span style={{ background: 'rgba(0, 180, 216, 0.15)', color: '#00b4d8', padding: '0.4rem', borderRadius: '8px', width: '38px', height: '38px', display: 'grid', placeItems: 'center' }}><AdminsIcon size={24} /></span>
                      <h2 style={{ margin: 0, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-muted)' }}>Platform Administrators</h2>
                    </div>
                    <div className="metric-value" style={{ fontSize: '2.5rem', fontWeight: '900', color: '#fff' }}>{adminsList.length}</div>
                    <div className="metric-footer" style={{ fontSize: '0.8rem', color: '#00b4d8', marginTop: '0.5rem', fontFamily: 'monospace' }}>Authorized personnel</div>
                  </article>
                ) : (
                  <article className="admin-metric-card tilt-card metric-cyan" style={{ background: 'rgba(10, 17, 69, 0.45)', border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 8px 32px 0 rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)' }}>
                    <div className="metric-header" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.75rem' }}>
                      <span style={{ background: 'rgba(0, 180, 216, 0.15)', color: '#00b4d8', padding: '0.4rem', borderRadius: '8px', width: '38px', height: '38px', display: 'grid', placeItems: 'center' }}><SchoolPortalIcon size={24} /></span>
                      <h2 style={{ margin: 0, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-muted)' }}>School Portal</h2>
                    </div>
                    <div className="metric-value" style={{ fontSize: '1.25rem', fontWeight: '900', color: '#fff', wordBreak: 'break-word', minHeight: '3.75rem', display: 'flex', alignItems: 'center' }}>
                      {schools.find(sch => String(sch.id) === String(session?.user?.school_id))?.school_name || 'Your School Portal'}
                    </div>
                    <div className="metric-footer" style={{ fontSize: '0.8rem', color: '#00b4d8', marginTop: '0.5rem', fontFamily: 'monospace' }}>Active affiliation</div>
                  </article>
                )}
              </section>

              {/* 2-Column Command Layout */}
              <div className="overview-dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '2rem', marginTop: '1.5rem' }}>
                
                {/* Left Panel - Command Area (70%) */}
                <div className="overview-main-flow" style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
                  
                  {/* Active live arena controller sector */}
                  <div className="kbc-panel glass-card" style={{ padding: '2rem', background: 'rgba(12, 17, 34, 0.95)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '12px', position: 'relative', overflow: 'hidden' }}>
                    <div className="glowing-border-glow" style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'linear-gradient(180deg, #ffd700, transparent)' }} />
                    <span className="overview-status" style={{ background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.6)', color: '#ffd700', padding: '0.3rem 0.8rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <LightningIcon size={12} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} /> LIVE COMMAND CENTER
                    </span>
                    <h3 style={{ margin: '1rem 0 0.5rem 0', fontSize: '1.6rem', fontWeight: '900', color: '#fff' }}>Hotseat Arena Host Console</h3>
                    <p style={{ margin: '0 0 1.5rem 0', color: 'var(--admin-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                      Orchestrate pacing triggers, time limits, lifeline resets, and push fresh questions to live contestants in real-time. Broadcast sequences directly onto spectator screens.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('Live KBC Controller')}
                      className="dash-chip-btn"
                      style={{
                        background: 'linear-gradient(135deg, #ffd700 0%, #ffa200 100%)',
                        color: '#050a2e',
                        border: 'none',
                        fontWeight: '900',
                        padding: '0.8rem 1.8rem',
                        fontSize: '0.9rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(255, 215, 0, 0.25)',
                        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.4)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.25)';
                      }}
                    >
                      LAUNCH CONTROLLER <ShowtimeIcon size={16} style={{ marginLeft: '0.4rem', verticalAlign: 'middle' }} />
                    </button>
                  </div>

                  {/* Recent Quiz Sectors Table */}
                  <div className="kbc-panel glass-card" style={{ padding: '1.75rem', background: 'rgba(12, 17, 34, 0.95)', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#ffd700' }}>Active Quiz Sectors</h3>
                    <p className="panel-subtitle" style={{ fontSize: '0.85rem', color: 'var(--admin-muted)', marginBottom: '1.2rem' }}>
                      {session?.user?.is_super_admin ? "Platform-wide database events overview" : "School database events overview"}
                    </p>

                    {quizzes.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--admin-muted)', fontStyle: 'italic' }}>
                        No quiz sectors found. Create one in Quiz Management.
                      </div>
                    ) : (
                      <div className="table-responsive" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '550px' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.25)', color: 'var(--admin-muted)', fontSize: '0.85rem' }}>
                              <th style={{ padding: '0.75rem 0.5rem', fontWeight: 'bold' }}>QUIZ TITLE</th>
                              <th style={{ padding: '0.75rem 0.5rem', fontWeight: 'bold' }}>ENROLLED</th>
                              <th style={{ padding: '0.75rem 0.5rem', fontWeight: 'bold' }}>ELIGIBILITY</th>
                              <th style={{ padding: '0.75rem 0.5rem', fontWeight: 'bold' }}>STATUS</th>
                              <th style={{ padding: '0.75rem 0.5rem', fontWeight: 'bold', textAlign: 'right' }}>ACTION</th>
                            </tr>
                          </thead>
                          <tbody>
                            {quizzes.slice(0, 3).map((q) => (
                              <tr key={q.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                                <td style={{ padding: '0.85rem 0.5rem' }}>
                                  <div style={{ fontWeight: 'bold', color: '#fff' }}>{q.title}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--admin-muted)', fontFamily: 'monospace' }}>
                                    {q.event_date ? `${q.event_date} @ ${q.event_time || ''}` : 'No date set'}
                                  </div>
                                </td>
                                <td style={{ padding: '0.85rem 0.5rem', fontWeight: 'bold', color: '#ffd54f' }}>
                                  {q.registered_count || 0} enrolled
                                </td>
                                <td style={{ padding: '0.85rem 0.5rem', color: 'var(--admin-muted)', fontSize: '0.8rem' }}>
                                  {q.require_eligibility ? '🔒 Restricted' : '🔓 Open Access'}
                                </td>
                                <td style={{ padding: '0.85rem 0.5rem' }}>
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    background: q.visible_to_students ? 'rgba(76, 175, 80, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                    color: q.visible_to_students ? '#4caf50' : 'rgba(255,255,255,0.5)',
                                    border: q.visible_to_students ? '1px solid rgba(76, 175, 80, 0.3)' : '1px solid rgba(255,255,255,0.1)'
                                  }}>
                                    {q.visible_to_students ? 'VISIBLE' : 'DRAFT'}
                                  </span>
                                </td>
                                <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }}>
                                  <button
                                    type="button"
                                    onClick={() => setActiveTab('Manage Quizzes')}
                                    className="dash-chip-btn"
                                    style={{
                                      fontSize: '0.75rem',
                                      padding: '0.3rem 0.7rem',
                                      background: 'rgba(212, 175, 55, 0.1)',
                                      borderColor: 'rgba(212, 175, 55, 0.3)',
                                      color: '#ffd700'
                                    }}
                                  >
                                    Manage 🛠️
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Panel - Analytics & Telemetry (30%) */}
                <div className="overview-sidebar-flow" style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
                  
                  {/* Student Demographics Card */}
                  <div className="kbc-panel glass-card" style={{ padding: '1.5rem', background: 'rgba(12, 17, 34, 0.95)', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#ffd700' }}>Student Demographics</h3>
                    <p className="panel-subtitle" style={{ fontSize: '0.8rem', color: 'var(--admin-muted)', marginBottom: '1.2rem' }}>
                      Distribution by academic year
                    </p>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                      {/* Year 1 */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                          <span style={{ color: 'var(--admin-text)' }}>1st Year Accounts</span>
                          <span style={{ fontWeight: 'bold', color: '#ffd54f' }}>{year1Count} ({Math.round((year1Count/maxCount)*100) || 0}%)</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${(year1Count/maxCount)*100}%`, height: '100%', background: 'linear-gradient(90deg, #ffd700, #ffae00)', borderRadius: '4px' }} />
                        </div>
                      </div>

                      {/* Year 2 */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                          <span style={{ color: 'var(--admin-text)' }}>2nd Year Accounts</span>
                          <span style={{ fontWeight: 'bold', color: '#42a5f5' }}>{year2Count} ({Math.round((year2Count/maxCount)*100) || 0}%)</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${(year2Count/maxCount)*100}%`, height: '100%', background: 'linear-gradient(90deg, #42a5f5, #0080ff)', borderRadius: '4px' }} />
                        </div>
                      </div>

                      {/* Year 3 */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                          <span style={{ color: 'var(--admin-text)' }}>3rd Year Accounts</span>
                          <span style={{ fontWeight: 'bold', color: '#e040fb' }}>{year3Count} ({Math.round((year3Count/maxCount)*100) || 0}%)</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${(year3Count/maxCount)*100}%`, height: '100%', background: 'linear-gradient(90deg, #e040fb, #ab47bc)', borderRadius: '4px' }} />
                        </div>
                      </div>

                      {/* Year 4 */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                          <span style={{ color: 'var(--admin-text)' }}>4th Year Accounts</span>
                          <span style={{ fontWeight: 'bold', color: '#00b4d8' }}>{year4Count} ({Math.round((year4Count/maxCount)*100) || 0}%)</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${(year4Count/maxCount)*100}%`, height: '100%', background: 'linear-gradient(90deg, #00b4d8, #00b0ff)', borderRadius: '4px' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </>
          );
        })()}

        {activeTab === 'Manage Quizzes' && (
          <section className="admin-overview-hero">
            <div className="overview-copy" style={{width: '100%'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
                <div>
                  <span className="overview-status" style={{
                    background: 'rgba(56, 189, 248, 0.25)',
                    border: '2px solid rgba(56, 189, 248, 0.8)',
                    color: '#ffffff',
                    padding: '0.45rem 1rem',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    letterSpacing: '0.07em',
                    textTransform: 'uppercase',
                    display: 'inline-block',
                    marginBottom: '0.5rem',
                    boxShadow: '0 0 12px rgba(56, 189, 248, 0.4)',
                    textShadow: '0 0 5px rgba(56, 189, 248, 0.8)'
                  }}>
                    Quiz Management
                  </span>
                  <h2 style={{margin: 0}}>Active Facilities</h2>
                </div>
                <div style={{display: 'flex', gap: '1rem'}}>
                  <button 
                    className="dash-chip-btn" 
                    onClick={() => handleDownloadTemplate('prelim')}
                    style={{borderColor: 'rgba(255,255,255,0.4)', color: 'var(--admin-text)', cursor: 'pointer', padding: '0.8rem 1.2rem', fontSize: '0.9rem', borderRadius: '8px'}}
                  >
                    <DownloadIcon size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> PRELIM TEMPLATE (MCQ)
                  </button>
                  <button 
                    className="dash-chip-btn" 
                    onClick={() => handleDownloadTemplate('fff')}
                    style={{borderColor: 'rgba(255,215,0,0.4)', color: '#ffd700', cursor: 'pointer', padding: '0.8rem 1.2rem', fontSize: '0.9rem', borderRadius: '8px'}}
                  >
                    <DownloadIcon size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> FFF TEMPLATE (SEQ)
                  </button>
                  <button 
                    className="dash-chip-btn" 
                    onClick={() => handleDownloadTemplate('hotseat')}
                    style={{borderColor: 'rgba(0,180,216,0.4)', color: '#00b4d8', cursor: 'pointer', padding: '0.8rem 1.2rem', fontSize: '0.9rem', borderRadius: '8px'}}
                  >
                    <DownloadIcon size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> HOTSEAT TEMPLATE
                  </button>
                  <button 
                    className="dash-chip-btn" 
                    onClick={handleCreateNewClick}
                    style={{background: 'rgb(var(--admin-cyan-rgb))', color: '#000', border: 'none', fontWeight: 'bold', padding: '0.8rem 1.5rem', fontSize: '1rem', cursor: 'pointer', borderRadius: '8px'}}
                  >
                    + CREATE NEW QUIZ
                  </button>
                </div>
              </div>
              
              <div style={{display: 'flex', gap: '2rem', flexDirection: 'column'}}>
                
                {/* List Section */}
                <div>
                  {loading ? (
                    <p>Loading quizzes...</p>
                  ) : quizzes.length === 0 ? (
                    <p>No quizzes created yet.</p>
                  ) : (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
                      {quizzes.map(quiz => (
                        <div 
                          key={quiz.id} 
                          className="admin-quiz-list-item"
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.5rem',
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid var(--admin-border)',
                            borderRadius: '12px',
                            padding: '1.8rem 2rem',
                            transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
                          }}
                        >
                          {/* Top portion containing details (left) and secondary action panel (right) */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr auto',
                            alignItems: 'center',
                            gap: '2.5rem',
                            width: '100%'
                          }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', textAlign: 'left' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900', color: 'var(--admin-text)' }}>
                                  {quiz.title}
                                </h3>
                                
                                {quiz.is_archived && (
                                  <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(255,80,80,0.15)', border: '1px solid rgba(255,80,80,0.3)', color: '#ff6b6b', fontWeight: 'bold', fontFamily: 'monospace' }}>
                                    ARCHIVED
                                  </span>
                                )}

                                <span style={{
                                  fontSize: '0.7rem',
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: '4px',
                                  fontWeight: 'bold',
                                  fontFamily: 'monospace',
                                  background: quiz.status === 'live' ? 'rgba(76,175,80,0.15)' : 'rgba(255,255,255,0.05)',
                                  color: quiz.status === 'live' ? '#98ff98' : 'rgba(255,255,255,0.6)',
                                  border: quiz.status === 'live' ? '1px solid rgba(76,175,80,0.3)' : '1px solid rgba(255,255,255,0.1)'
                                }}>
                                  {quiz.status.replace('_', ' ').toUpperCase()}
                                </span>
                              </div>
                              
                              <p style={{ margin: 0, color: 'var(--admin-muted)', fontSize: '0.92rem', lineHeight: '1.5' }}>
                                {quiz.description || 'No event description provisioned yet.'}
                              </p>

                              <div className="admin-quiz-list-meta" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--admin-muted)', fontFamily: 'monospace', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.6rem' }}>
                                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                                  <span>👥 Enrolled: <strong style={{ color: 'var(--admin-text)' }}>{quiz.registered_count}</strong></span>
                                  {quiz.event_date && <span>📅 Date: <strong style={{ color: 'var(--admin-text)' }}>{new Date(quiz.event_date).toLocaleDateString()}</strong></span>}
                                </div>
                                <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap', marginTop: '0.4rem', background: 'rgba(255, 255, 255, 0.025)', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                  <span style={{ color: '#ffffff', fontSize: '0.85rem' }}>❓ Total: <strong style={{ color: '#ffeb3b', fontSize: '0.95rem' }}>{quiz.total_questions_count || 0}</strong></span>
                                  <span style={{ color: '#ffffff', fontSize: '0.85rem' }}>📝 Prelim: <strong style={{ color: '#81c784', fontSize: '0.95rem' }}>{quiz.prelim_questions_count || 0}</strong></span>
                                  <span style={{ color: '#ffffff', fontSize: '0.85rem' }}>⚡ FFF: <strong style={{ color: '#ffb74d', fontSize: '0.95rem' }}>{quiz.fff_questions_count || 0}</strong></span>
                                  <span style={{ color: '#ffffff', fontSize: '0.85rem' }}>👑 Hotseat: <strong style={{ color: '#00e5ff', fontSize: '0.95rem' }}>{quiz.hotseat_1_questions_count || 0} / {quiz.hotseat_2_questions_count || 0} / {quiz.hotseat_3_questions_count || 0}</strong></span>
                                  <span style={{ color: '#ffffff', fontSize: '0.85rem' }}>🔄 Switch: <strong style={{ color: '#f472b6', fontSize: '0.95rem' }}>{quiz.switch_categories_count || 0} / 6</strong></span>
                                </div>
                              </div>
                            </div>

                            {/* Secondary Action Panel: buttons inside grid */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '290px', flexShrink: 0 }}>
                              
                              {/* Small status indicator in top-right of panel */}
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', alignItems: 'center', marginBottom: '0.1rem', flexWrap: 'wrap' }}>
                                {quiz.description?.includes('[SYSTEM_GLOBAL_REQUEST]') && (
                                  <span className="badge-global-request blinking-border-gold" style={{ display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.4)', color: 'rgb(212,175,55)', fontWeight: 'bold', fontSize: '0.68rem', gap: '0.3rem', fontFamily: 'monospace', boxShadow: '0 0 10px rgba(212,175,55,0.2)' }}>
                                    📢 GLOBAL REQUESTED
                                  </span>
                                )}
                                {(!quiz.allowed_schools || quiz.allowed_schools.length === 0) && (
                                  <span className="badge-global-scope" style={{ display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(0,188,212,0.15)', border: '1px solid rgba(0,188,212,0.3)', color: 'rgb(0,188,212)', fontWeight: 'bold', fontSize: '0.68rem', gap: '0.3rem', fontFamily: 'monospace' }}>
                                    🌐 GLOBAL EVENT
                                  </span>
                                )}
                                {quiz.visible_to_students ? (
                                  <span className="badge-published" style={{ display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(76,175,80,0.15)', border: '1px solid rgba(76,175,80,0.3)', color: '#98ff98', fontWeight: 'bold', fontSize: '0.68rem', gap: '0.3rem', fontFamily: 'monospace' }}>
                                    🟢 PUBLISHED
                                  </span>
                                ) : (
                                  <span className="badge-draft" style={{ display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontWeight: 'bold', fontSize: '0.68rem', gap: '0.3rem', fontFamily: 'monospace' }}>
                                    ⚪ DRAFT
                                  </span>
                                )}
                              </div>

                              {/* Content Creation Controls & Toggles */}
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <button 
                                  className="dash-chip-btn glow-gold blinking-border-gold" 
                                  onClick={() => {
                                    setSelectedKbcQuizId(quiz.id);
                                    setActiveTab('Live KBC Controller');
                                  }}
                                  style={{
                                    borderColor: 'rgba(255, 215, 0, 0.95)',
                                    color: '#ffd700',
                                    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 180, 0, 0.05) 100%)',
                                    fontSize: '0.8rem',
                                    padding: '0.6rem',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    borderRadius: '6px',
                                    boxShadow: '0 0 15px rgba(255, 215, 0, 0.35)',
                                    textShadow: '0 0 6px rgba(255, 215, 0, 0.5)',
                                    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.boxShadow = '0 0 25px rgba(255, 215, 0, 0.55)';
                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 215, 0, 0.25) 0%, rgba(255, 180, 0, 0.1) 100%)';
                                    e.currentTarget.style.transform = 'scale(1.03)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.35)';
                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 180, 0, 0.05) 100%)';
                                    e.currentTarget.style.transform = 'none';
                                  }}
                                >
                                  🎙️ Live Console
                                </button>

                                <button 
                                  className="dash-chip-btn" 
                                  onClick={() => handleEditClick(quiz)}
                                  style={{
                                    borderColor: 'rgba(212, 175, 55, 0.45)',
                                    color: 'rgb(212, 175, 55)',
                                    background: 'rgba(212, 175, 55, 0.03)',
                                    fontSize: '0.8rem',
                                    padding: '0.6rem',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    borderRadius: '6px'
                                  }}
                                >
                                  ✏️ Edit Quiz
                                </button>
                                
                                <label 
                                  className="dash-chip-btn" 
                                  style={{
                                    borderColor: 'rgba(255, 255, 255, 0.4)',
                                    color: 'var(--admin-text)',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    padding: '0.6rem',
                                    textAlign: 'center',
                                    display: 'block',
                                    fontWeight: 'bold',
                                    borderRadius: '6px'
                                  }}
                                >
                                  📥 Upload Excel
                                  <input 
                                    type="file" 
                                    accept=".xlsx" 
                                    style={{display: 'none'}} 
                                    onChange={(e) => {
                                      if (e.target.files[0]) {
                                        handleUploadExcel(quiz.id, e.target.files[0]);
                                        e.target.value = null;
                                      }
                                    }} 
                                  />
                                </label>

                                <button 
                                  className="dash-chip-btn" 
                                  onClick={() => toggleQuizSetting(quiz.id, 'is_registration_open', quiz.is_registration_open)}
                                  style={{
                                    borderColor: quiz.is_registration_open ? 'rgb(var(--admin-cyan-rgb))' : 'var(--admin-border)',
                                    color: quiz.is_registration_open ? 'rgb(var(--admin-cyan-rgb))' : 'var(--admin-muted)',
                                    background: quiz.is_registration_open ? 'rgba(var(--admin-cyan-rgb), 0.05)' : 'transparent',
                                    fontSize: '0.78rem',
                                    padding: '0.6rem',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    borderRadius: '6px'
                                  }}
                                >
                                  {quiz.is_registration_open ? '🔓 Reg Open' : '🔒 Reg Closed'}
                                </button>

                                <button 
                                  className="dash-chip-btn" 
                                  onClick={() => handleDeleteClick(quiz.id)}
                                  style={{
                                    borderColor: 'rgba(255,80,80,0.4)',
                                    color: 'rgb(255,80,80)',
                                    background: 'rgba(255,80,80,0.03)',
                                    fontSize: '0.8rem',
                                    padding: '0.6rem',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    borderRadius: '6px'
                                  }}
                                >
                                  🗑️ Delete
                                </button>

                                <button 
                                  className="dash-chip-btn" 
                                  onClick={() => handleDownloadDetailedReport(quiz.id, quiz.title)}
                                  style={{
                                    borderColor: 'rgba(212,175,55,0.4)',
                                    color: 'rgb(212,175,55)',
                                    background: 'rgba(212,175,55,0.03)',
                                    fontSize: '0.8rem',
                                    padding: '0.6rem',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    borderRadius: '6px'
                                  }}
                                >
                                  📊 PDF Report
                                </button>

                                {session?.user?.is_super_admin && quiz.description?.includes('[SYSTEM_GLOBAL_REQUEST]') && (
                                  <button 
                                    className="dash-chip-btn glow-gold blinking-border-gold" 
                                    onClick={() => handleApproveGlobalEvent(quiz)}
                                    style={{
                                      borderColor: '#ffd700',
                                      color: '#ffd700',
                                      background: 'rgba(255, 215, 0, 0.1)',
                                      fontSize: '0.8rem',
                                      padding: '0.6rem',
                                      cursor: 'pointer',
                                      fontWeight: 'bold',
                                      borderRadius: '6px',
                                      gridColumn: '1 / -1',
                                      boxShadow: '0 0 10px rgba(255, 215, 0, 0.25)',
                                      marginTop: '0.2rem'
                                    }}
                                  >
                                    🌟 Approve Global Event
                                  </button>
                                )}

                                {!session?.user?.is_super_admin && quiz.allowed_schools?.length > 0 && !quiz.description?.includes('[SYSTEM_GLOBAL_REQUEST]') && (
                                  <button 
                                    className="dash-chip-btn" 
                                    onClick={() => handleRequestGlobalEvent(quiz)}
                                    style={{
                                      borderColor: 'rgba(0,188,212,0.6)',
                                      color: 'rgb(0,188,212)',
                                      background: 'rgba(0,188,212,0.03)',
                                      fontSize: '0.8rem',
                                      padding: '0.6rem',
                                      cursor: 'pointer',
                                      fontWeight: 'bold',
                                      borderRadius: '6px',
                                      gridColumn: '1 / -1',
                                      marginTop: '0.2rem'
                                    }}
                                  >
                                    📢 Request Global Event
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Large, beautiful glowing Questions button centered at the bottom */}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: '100%',
                            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                            paddingTop: '1.2rem',
                            marginTop: '0.2rem'
                          }}>
                            <button 
                              className="dash-chip-btn" 
                              onClick={() => handleManageQuestionsClick(quiz)}
                              style={{
                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                color: '#ffffff',
                                background: 'rgba(255, 255, 255, 0.05)',
                                fontWeight: 'bold',
                                fontSize: '1.05rem',
                                padding: '0.8rem 3rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                cursor: 'pointer',
                                borderRadius: '24px',
                                transition: 'all 0.2s ease',
                                width: '70%',
                                maxWidth: '400px'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                e.currentTarget.style.transform = 'none';
                              }}
                            >
                              📋 Questions
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </section>
        )}

        {activeTab === 'Live KBC Controller' && (
          <section className="admin-overview-hero kbc-controller-container">
            {!selectedKbcQuizId ? (
              <div className="kbc-quiz-selector">
                <span className="overview-status" style={{
                  background: 'rgba(56, 189, 248, 0.25)',
                  border: '2px solid rgba(56, 189, 248, 0.8)',
                  color: '#ffffff',
                  padding: '0.45rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  display: 'inline-block',
                  marginBottom: '0.5rem',
                  boxShadow: '0 0 12px rgba(56, 189, 248, 0.4)',
                  textShadow: '0 0 5px rgba(56, 189, 248, 0.8)'
                }}>
                  KBC Event Command Center
                </span>
                <h2>Select a Live Event to Control</h2>
                <div style={{display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '2rem'}}>
                  {quizzes.map(quiz => (
                    <div key={quiz.id} className="admin-quiz-list-item kbc-selector-item">
                      <div>
                        <h3>{quiz.title}</h3>
                        <div className="admin-quiz-list-meta">
                          <span>Active Stage: <strong style={{color: '#ffd700'}}>{quiz.current_stage?.replace('_', ' ').toUpperCase() || 'REGULAR'}</strong></span>
                          <span>Registered: {quiz.registered_count}</span>
                        </div>
                      </div>
                      <button 
                        className="dash-chip-btn kbc-control-launch-btn"
                        onClick={() => setSelectedKbcQuizId(quiz.id)}
                        style={{borderColor: '#ffd700', color: '#ffd700'}}
                      >
                        CONTROL LIVE EVENT
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="kbc-active-console">
                {/* Header */}
                <div className="kbc-console-header">
                  <div>
                    <button className="kbc-back-btn" onClick={() => { setSelectedKbcQuizId(null); setKbcQuizDetail(null); setKbcLiveState(null); }}>
                      &larr; Exit Console
                    </button>
                    <h2>Live KBC Console: <span style={{color: '#ffd700'}}>{kbcQuizDetail?.title}</span></h2>
                  </div>
                  <div className="kbc-console-status">
                    <span className="kbc-status-pill">
                      <span className="pulse-dot"></span>
                      SYSTEM LIVE (Polling active)
                    </span>
                    <button className="kbc-refresh-btn" onClick={() => fetchKbcControllerData(selectedKbcQuizId)} style={{ marginRight: '0.5rem' }}>
                      Force Sync
                    </button>
                    <Link 
                      to={`/quiz-arena/${selectedKbcQuizId}?role=host`} 
                      target="_blank" 
                      className="kbc-refresh-btn" 
                      style={{ 
                        background: 'linear-gradient(135deg, #ffd700 0%, #ffa500 100%)', 
                        color: '#000', 
                        border: 'none', 
                        fontWeight: 'bold',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        textDecoration: 'none',
                        boxShadow: '0 2px 10px rgba(255, 215, 0, 0.2)'
                      }}
                    >
                      🎙️ Host Showtime (Arena Mode)
                    </Link>
                  </div>
                </div>

                {/* REDESIGNED: KBC Visual 5-Phase Roadmap Bar */}
                <div className="kbc-roadmap-container">
                  <div className="kbc-roadmap-track" />
                  <div 
                    className="kbc-roadmap-track-fill" 
                    style={{ width: `${((getActivePhaseNum(kbcQuizDetail?.current_stage) - 1) / 4) * 100}%` }}
                  />
                  <div className="kbc-roadmap-steps">
                    {KBC_PHASES.map((phase) => {
                      const activePhase = getActivePhaseNum(kbcQuizDetail?.current_stage);
                      const isActive = phase.num === activePhase;
                      const isPassed = phase.num < activePhase;
                      const phaseClass = isActive ? 'active' : isPassed ? 'passed' : 'future';

                      // Find first stage value for this phase to support clickable phase navigation shortcuts
                      let targetStageVal = 'regular';
                      if (phase.num === 2) targetStageVal = 'batch_selection';
                      else if (phase.num === 3) targetStageVal = 'fff_batch_1';
                      else if (phase.num === 4) targetStageVal = 'hotseat_batch_1';
                      else if (phase.num === 5) targetStageVal = 'completed';

                      return (
                        <button
                          key={phase.num}
                          onClick={() => handleUpdateStage(targetStageVal)}
                          disabled={kbcLoading}
                          className={`kbc-roadmap-step ${phaseClass}`}
                          title={`Switch directly to: ${phase.label}`}
                        >
                          <div className="roadmap-medallion">
                            {isPassed ? '✓' : phase.icon}
                          </div>
                          <div className="roadmap-label-wrap">
                            <span className="roadmap-num">PHASE 0{phase.num}</span>
                            <strong className="roadmap-title">{phase.label}</strong>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Split-Screen 2-Column Deck Workspace */}
                <div className="kbc-control-deck" style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '2rem', marginTop: '2rem', alignItems: 'start' }}>
                  
                  {/* LEFT COLUMN: Interactive Assistant, Promotions, & Stats */}
                  <div className="kbc-deck-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* HOST COPILOT WIZARD CARD */}
                    {(() => {
                      const guide = getHostGuide(kbcQuizDetail?.current_stage);
                      const nextStage = getNextStageValue(kbcQuizDetail?.current_stage);
                      const prevStage = getPrevStageValue(kbcQuizDetail?.current_stage);

                      return (
                        <div className="kbc-panel host-copilot-card">
                          <div className="copilot-header">
                            <span className="copilot-badge">🤖 Host Copilot Assistant</span>
                            <h4>Active Task Guide</h4>
                          </div>
                          <div className="copilot-content">
                            <h3 className="copilot-step-title">{guide.title}</h3>
                            <p className="copilot-step-desc">{guide.desc}</p>
                            
                            <div className="copilot-actions-list">
                              <h5>REQUIRED ACTIONS:</h5>
                              <ul>
                                {guide.actions.map((act, i) => (
                                  <li key={i}>{act}</li>
                                ))}
                              </ul>
                            </div>

                            {/* Sequential Action Buttons */}
                            <div className="copilot-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1.5rem' }}>
                              {nextStage && (
                                <button
                                  className="kbc-advance-btn pulse-button"
                                  disabled={kbcLoading}
                                  onClick={() => handleUpdateStage(nextStage)}
                                  style={{
                                    background: 'linear-gradient(135deg, #00e676 0%, #00b0ff 100%)',
                                    color: '#000',
                                    fontWeight: '900',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    boxShadow: '0 4px 15px rgba(0, 230, 118, 0.3)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    width: '100%'
                                  }}
                                >
                                  ADVANCE TO {guide.nextLabel?.toUpperCase()} ➔
                                </button>
                              )}
                              {prevStage && (
                                <button
                                  className="kbc-secondary-btn"
                                  disabled={kbcLoading}
                                  onClick={() => handleUpdateStage(prevStage)}
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    color: '#ccc',
                                    padding: '0.6rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    width: '100%',
                                    transition: 'all 0.3s'
                                  }}
                                >
                                  ⏪ RETURN TO PREVIOUS PHASE
                                </button>
                              )}
                            </div>

                            {/* Manual Stepper Accordion Toggle */}
                            <div style={{ marginTop: '1.2rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.8rem' }}>
                              <button
                                onClick={() => setShowManualStages(!showManualStages)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--admin-cyan)',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  padding: 0,
                                  width: '100%',
                                  justifyContent: 'center',
                                  fontWeight: 'bold'
                                }}
                              >
                                {showManualStages ? '🎛️ Hide Stage Override' : '🎛️ Show Manual Controller Board'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* EXPANDABLE MANUAL CIRCULAR STEP TIMELINE OVERRIDE */}
                    {showManualStages && (
                      <div className="kbc-panel stage-director-panel-manual" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#ffb300', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          ⚠️ Manual Stage Override Board
                        </h4>
                        <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', margin: '0 0 1.2rem 0', lineHeight: '1.4' }}>
                          Warning: Force-shifting to arbitrary stages outside the standard event progression should only be done for debugging or custom overrides.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
                          {KBC_STAGES.map((stage, idx) => {
                            const isCurrent = kbcQuizDetail?.current_stage === stage.value;
                            return (
                              <button
                                key={stage.value}
                                onClick={() => handleUpdateStage(stage.value)}
                                disabled={kbcLoading}
                                style={{
                                  background: isCurrent ? 'rgba(255, 179, 0, 0.15)' : 'rgba(255,255,255,0.02)',
                                  border: isCurrent ? '1px solid #ffb300' : '1px solid rgba(255,255,255,0.08)',
                                  borderRadius: '6px',
                                  padding: '0.5rem 0.25rem',
                                  color: isCurrent ? '#ffb300' : 'rgba(255,255,255,0.7)',
                                  fontSize: '0.65rem',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  textAlign: 'center',
                                  lineHeight: '1.3'
                                }}
                              >
                                <div style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>{idx + 1}</div>
                                {stage.label.replace('FFF — ', '').replace('Hotseat — ', '')}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* DYNAMIC CONTESTANT PROMOTION HUB */}
                    <div className="kbc-panel hotseat-info-panel">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0 }}>Contestant Hub</h3>
                        {kbcLiveState?.hotseat_attempt ? (
                          <span className="live-pulse-badge">🔴 LIVE</span>
                        ) : (
                          <span className="vacant-badge">VACANT</span>
                        )}
                      </div>

                      {kbcLiveState?.hotseat_attempt ? (
                        <div className="hotseat-metrics-card">
                          <div className="metrics-avatar-row">
                            <div className="hs-avatar">👤</div>
                            <div>
                              <strong className="hs-name">{kbcLiveState.hotseat_attempt.student_name}</strong>
                              <span className="hs-id">Player ID: {kbcLiveState.hotseat_attempt.player_id}</span>
                            </div>
                          </div>

                          <div className="hs-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', margin: '1.2rem 0' }}>
                            <div className="hs-stat-item">
                              <span className="hs-stat-label">LEVEL reached</span>
                              <strong className="hs-stat-val text-gold">Q{kbcLiveState.hotseat_attempt.current_question_index + 1}</strong>
                            </div>
                            <div className="hs-stat-item">
                              <span className="hs-stat-label">total points</span>
                              <strong className="hs-stat-val text-cyan">{kbcLiveState.hotseat_attempt.score} pts</strong>
                            </div>
                          </div>

                          {/* Lifelines indicators */}
                          <div className="hs-lifelines-rack">
                            <span className="hs-label">LIFELINES ACTIVATED:</span>
                            <div className="hs-lifelines-badges">
                              <div className={`hs-badge ${kbcLiveState.hotseat_attempt.lifeline_5050_used ? 'used' : 'ready'}`}>
                                50:50 {kbcLiveState.hotseat_attempt.lifeline_5050_used ? '❌' : '✅'}
                              </div>
                              <div className={`hs-badge ${kbcLiveState.hotseat_attempt.lifeline_poll_used ? 'used' : 'ready'}`}>
                                Poll {kbcLiveState.hotseat_attempt.lifeline_poll_used ? '❌' : '✅'}
                              </div>
                              <div className={`hs-badge ${kbcLiveState.hotseat_attempt.lifeline_switch_used ? 'used' : 'ready'}`}>
                                Switch {kbcLiveState.hotseat_attempt.lifeline_switch_used ? '❌' : '✅'}
                              </div>
                            </div>
                          </div>

                          {/* Quick Enter Host Arena Button inside Sidebar for easy access */}
                          <div style={{ marginTop: '1.2rem' }}>
                            <Link 
                              to={`/quiz-arena/${selectedKbcQuizId}?role=host`} 
                              target="_blank" 
                              className="dash-chip-btn glow-gold-button"
                              style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.4rem',
                                background: 'linear-gradient(135deg, #ffd700 0%, #ffa500 100%)',
                                color: '#000',
                                fontWeight: 'bold',
                                border: 'none',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                fontSize: '0.85rem'
                              }}
                            >
                              🎙️ ENTER HOST ARENA
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', margin: '0 0 1rem 0', lineHeight: '1.4' }}>
                            No contestant is currently playing on the Hotseat. Select a top preliminary scorer below to promote them directly to the main stage.
                          </p>

                          {/* Quick Promote Dropdown */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            <select 
                              value={selectedPromoteStudentId} 
                              onChange={e => setSelectedPromoteStudentId(e.target.value)}
                              className="admin-form-input"
                              style={{
                                background: 'rgba(0,0,0,0.5)',
                                border: '1px solid var(--admin-border)',
                                color: '#fff',
                                padding: '0.6rem',
                                borderRadius: '6px',
                                width: '100%',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
                            >
                              <option value="">-- Choose Contestant --</option>
                              {prelimScoresList.map(score => (
                                <option key={score.student_id} value={score.student_id}>
                                  {score.student_name} ({score.score} pts)
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => {
                                if (!selectedPromoteStudentId) {
                                  showBeautifulPopup("Selection Required", "Please select a contestant from the dropdown first.", "error");
                                  return;
                                }
                                handlePromoteToHotseat(selectedPromoteStudentId);
                              }}
                              disabled={kbcLoading}
                              className="kbc-advance-btn"
                              style={{
                                background: 'linear-gradient(135deg, #ffd700 0%, #ffa500 100%)',
                                color: '#000',
                                border: 'none',
                                fontWeight: '900',
                                padding: '0.6rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                textTransform: 'uppercase',
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.3rem'
                              }}
                            >
                              🚀 PROMOTE DIRECTLY
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* SLICK VERTICAL PRIZE LADDER INDICATOR */}
                    {kbcLiveState?.hotseat_attempt && (
                      <div className="kbc-panel prize-ladder-panel-compact">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                          <h4 style={{ margin: 0, fontSize: '0.8rem', textTransform: 'uppercase', color: '#ffb300' }}>KBC Prize Ladder</h4>
                          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>Q1-Q15 Milestones</span>
                        </div>
                        <div className="kbc-ladder-grid-compact">
                          {KBC_LADDER.map(level => {
                            const isActive = kbcLiveState.hotseat_attempt.current_question_index === level.q;
                            const isPassed = kbcLiveState.hotseat_attempt.current_question_index > level.q;
                            return (
                              <div 
                                key={level.q} 
                                className={`kbc-ladder-row-compact ${isActive ? 'active' : ''} ${isPassed ? 'passed' : ''} ${level.checkpoint ? 'checkpoint' : ''} ${level.jackpot ? 'jackpot' : ''}`}
                              >
                                <span className="compact-q-num font-mono">{level.q}</span>
                                <span className="compact-q-sym">♦</span>
                                <span className="compact-q-val font-mono">{level.val}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* RIGHT COLUMN: Dynamic Workspace Deck (Takes full remaining width) */}
                  <div className="kbc-deck-main-panel">
                    
                    {/* Preliminary Stage details */}
                    {kbcQuizDetail?.current_stage === 'regular' && (
                      <div className="kbc-panel context-panel">
                        <h3>Preliminary Leaderboard</h3>
                        <p className="panel-subtitle">Students currently playing standard preliminary round</p>
                        <div className="scores-table-container">
                          <table className="kbc-table">
                            <thead>
                              <tr>
                                <th>Rank</th>
                                <th>Name</th>
                                <th>Player ID</th>
                                <th>Score</th>
                                <th>Progress</th>
                                <th>Time Taken</th>
                                <th>Correct</th>
                                <th>Incorrect</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {prelimScoresList.length === 0 ? (
                                <tr><td colSpan="9" className="text-center">No submissions yet. Waiting for students to start...</td></tr>
                              ) : (
                                prelimScoresList.map(score => (
                                  <tr key={score.student_id} className={score.completed ? '' : 'in-progress-row'}>
                                    <td>#{score.rank}</td>
                                    <td className="text-gold">{score.student_name}</td>
                                    <td>{score.player_id}</td>
                                    <td className="text-cyan font-bold">{score.score}</td>
                                    <td>{score.questions_answered}/{score.total_questions}</td>
                                    <td>{score.time_taken ? `${score.time_taken.toFixed(1)}s` : '-'}</td>
                                    <td className="text-emerald font-bold">{score.correct_count ?? '-'}</td>
                                    <td className="text-rose font-bold">{score.incorrect_count ?? '-'}</td>
                                    <td>
                                      <span className={`status-pill ${score.completed ? 'completed' : 'in-progress'}`}>
                                        {score.completed ? '✅ COMPLETED' : '⏳ IN PROGRESS'}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Batch Selection Stage */}
                    {kbcQuizDetail?.current_stage === 'batch_selection' && (
                      <div className="kbc-panel context-panel">
                        <h3>Batch Configuration</h3>
                        <p className="panel-subtitle">Set FFF contestants. Group the top 30% of preliminary scorers into 3 equal batches.</p>
                        
                        <div className="batch-actions-bar">
                          <button className="kbc-secondary-btn" onClick={handleAutoGenerateBatches} disabled={kbcLoading}>
                            ⚡ Auto-Generate Batches
                          </button>
                          <button className="kbc-save-btn" onClick={handleSaveBatches} disabled={kbcLoading}>
                            💾 Lock & Save Batches
                          </button>
                        </div>

                        <div className="batches-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.2rem', marginTop: '1.5rem' }}>
                          <div className="batch-input-card">
                            <h4>Batch 1 (FFF Round 1)</h4>
                            <textarea 
                              className="batch-input-field" 
                              value={batch1Input} 
                              onChange={e => setBatch1Input(e.target.value)}
                              placeholder="Comma separated User IDs (e.g. 101, 102, 103)"
                              style={{ width: '100%', height: '80px', minHeight: '80px' }}
                            />
                            <span className="batch-count">Count: {batch1Input ? batch1Input.split(',').filter(x => x.trim()).length : 0} / {targetBatchSize}</span>
                          </div>

                          <div className="batch-input-card">
                            <h4>Batch 2 (FFF Round 2)</h4>
                            <textarea 
                              className="batch-input-field" 
                              value={batch2Input} 
                              onChange={e => setBatch2Input(e.target.value)}
                              placeholder="Comma separated User IDs"
                              style={{ width: '100%', height: '80px', minHeight: '80px' }}
                            />
                            <span className="batch-count">Count: {batch2Input ? batch2Input.split(',').filter(x => x.trim()).length : 0} / {targetBatchSize}</span>
                          </div>

                          <div className="batch-input-card">
                            <h4>Batch 3 (FFF Round 3)</h4>
                            <textarea 
                              className="batch-input-field" 
                              value={batch3Input} 
                              onChange={e => setBatch3Input(e.target.value)}
                              placeholder="Comma separated User IDs"
                              style={{ width: '100%', height: '80px', minHeight: '80px' }}
                            />
                            <span className="batch-count">Count: {batch3Input ? batch3Input.split(',').filter(x => x.trim()).length : 0} / {targetBatchSize}</span>
                          </div>
                        </div>

                        {/* Top 30 Preliminary list for reference */}
                        <div style={{marginTop: '2rem'}}>
                          <h4>Top Preliminary Scorers Reference</h4>
                          <div className="scores-table-container mini-table">
                            <table className="kbc-table">
                              <thead>
                                <tr>
                                  <th>Rank</th>
                                  <th>User ID</th>
                                  <th>Name</th>
                                  <th>Player ID</th>
                                  <th>Score</th>
                                </tr>
                              </thead>
                              <tbody>
                                {prelimScoresList.map(score => (
                                  <tr key={score.student_id}>
                                    <td>#{score.rank}</td>
                                    <td><strong className="text-cyan">{score.student_id}</strong></td>
                                    <td className="text-gold">{score.student_name}</td>
                                    <td>{score.player_id}</td>
                                    <td>{score.score}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* FFF Stages */}
                    {kbcQuizDetail?.current_stage.startsWith('fff_') && (
                      <div className="kbc-panel context-panel">
                        <h3>FFF Live Standings</h3>
                        <p className="panel-subtitle">Submissions for active batch in real time. Winner is the fastest correct responder.</p>

                        {fffResultsData?.question && (
                          <div className="fff-question-box">
                            <h4>FFF Active Question:</h4>
                            <p className="fff-question-text">{fffResultsData.question.text}</p>
                          </div>
                        )}

                        <div className="fff-standings-table">
                          <table className="kbc-table">
                            <thead>
                              <tr>
                                <th>Rank</th>
                                <th>Contender</th>
                                <th>Player ID</th>
                                <th>Choice Submitted</th>
                                <th>Time Taken</th>
                                <th>Status</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {!fffResultsData?.results || fffResultsData.results.length === 0 ? (
                                <tr><td colSpan="7" className="text-center">No submissions received yet...</td></tr>
                              ) : (
                                fffResultsData.results.map((res, idx) => {
                                  const isWinner = res.is_correct && idx === 0;
                                  return (
                                    <tr key={res.id} className={isWinner ? 'fff-winner-row' : ''}>
                                      <td>
                                        {isWinner ? (
                                          <span className="winner-crown">👑 #1 Winner</span>
                                        ) : (
                                          `#${idx + 1}`
                                        )}
                                      </td>
                                      <td className="text-gold font-bold">{res.student_name}</td>
                                      <td>{res.player_id}</td>
                                      <td className="font-mono text-cyan" style={{ fontSize: '0.85rem' }}>
                                        {(() => {
                                          if (res.submitted_sequence) {
                                            const choiceIds = res.submitted_sequence.split(',');
                                            const arrangedLetters = choiceIds.map(cid => {
                                              const choiceIndex = fffResultsData.question.choices?.findIndex(c => String(c.id) === cid);
                                              return choiceIndex !== -1 ? ['A','B','C','D'][choiceIndex] : '?';
                                            });
                                            return arrangedLetters.join(' → ');
                                          }
                                          return res.selected_choice_text || 'No selection';
                                        })()}
                                      </td>
                                      <td className="text-pink font-mono font-bold">{res.time_taken_seconds?.toFixed(3)}s</td>
                                      <td>
                                        {res.is_correct ? (
                                          <span className="badge-correct">CORRECT</span>
                                        ) : (
                                          <span className="badge-incorrect">INCORRECT</span>
                                        )}
                                      </td>
                                      <td>
                                        {(() => {
                                          const stage = kbcQuizDetail?.current_stage;
                                          const isAlreadyPromoted = 
                                            (stage === 'fff_batch_1' && kbcQuizDetail?.hotseat_player_1 === res.student) ||
                                            (stage === 'fff_batch_2' && kbcQuizDetail?.hotseat_player_2 === res.student) ||
                                            (stage === 'fff_batch_3' && kbcQuizDetail?.hotseat_player_3 === res.student) ||
                                            kbcLiveState?.hotseat_attempt?.student === res.student;
                                            
                                          if (isAlreadyPromoted) {
                                            return (
                                              <span 
                                                className="status-pill completed animate-pulse" 
                                                style={{ 
                                                  background: 'rgba(76, 175, 80, 0.15)', 
                                                  border: '1px solid #4caf50', 
                                                  color: '#4caf50', 
                                                  fontSize: '0.75rem', 
                                                  padding: '0.4rem 0.8rem', 
                                                  borderRadius: '4px',
                                                  fontWeight: 'bold',
                                                  textShadow: '0 0 5px rgba(76, 175, 80, 0.3)',
                                                  display: 'inline-block'
                                                }}
                                              >
                                                🚀 Promoted
                                              </span>
                                            );
                                          }
                                          
                                          return (
                                            <button 
                                              className="dash-chip-btn kbc-action-btn"
                                              onClick={() => handlePromoteToHotseat(res.student)}
                                              disabled={kbcLoading}
                                              style={{borderColor: '#ffd700', color: '#ffd700', padding: '0.4rem 0.8rem', fontSize: '0.75rem'}}
                                            >
                                              Promote
                                            </button>
                                          );
                                        })()}
                                      </td>
                                    </tr>
                                  )
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Hotseat Stages */}
                    {kbcQuizDetail?.current_stage.startsWith('hotseat_') && (
                      <div className="kbc-panel context-panel" style={{ padding: '3rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(10, 15, 30, 0.98)' }}>
                        <div className="kbc-crest" style={{ fontSize: '3.5rem', color: '#ffd700', marginBottom: '1rem' }}>
                          🎙️
                        </div>
                        <h3 className="golden-glow" style={{ fontSize: '2.2rem', fontWeight: '900', margin: '0 0 0.8rem 0', letterSpacing: '0.05em' }}>
                          HOTSEAT SHOWTIME (ARENA MODE)
                        </h3>
                        <p className="panel-subtitle" style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.95)', maxWidth: '650px', lineHeight: '1.7', margin: '0 auto 2rem auto', fontWeight: '500' }}>
                          The Hotseat round for <strong style={{ color: '#ffd700', fontSize: '1.25rem' }}>Batch {kbcQuizDetail.current_stage.slice(-1)}</strong> is now active! Command the show, view contestant preselected choices, read KBC-style trivia, and lock choices using the premium, immersive full-screen Host Arena interface.
                        </p>

                        <div style={{ 
                          background: 'rgba(212, 175, 55, 0.05)', 
                          border: '1px solid rgba(212, 175, 55, 0.3)', 
                          borderRadius: '12px', 
                          padding: '1.75rem 2.25rem', 
                          marginBottom: '2.5rem', 
                          maxWidth: '650px', 
                          width: '100%',
                          textAlign: 'left'
                        }}>
                          <h4 style={{ color: '#ffd700', fontSize: '1.25rem', fontWeight: '900', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '0.05em' }}>
                            🎬 HOST OPERATIONAL STEPS
                          </h4>
                          <ul style={{ color: '#fff', fontSize: '1.05rem', lineHeight: '1.7', paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <li>
                              <strong style={{ color: '#ffd700' }}>Step 1: Choose a Contestant</strong> — Use the <strong>"Contestant Hub"</strong> panel on the left to select and promote a student directly to the hotseat (if not already active).
                            </li>
                            <li>
                              <strong style={{ color: '#ffd700' }}>Step 2: Enter Host Arena</strong> — Click the big yellow button below to open the **Broadcast Arena Controller** in a new full-screen tab.
                            </li>
                            <li>
                              <strong style={{ color: '#ffd700' }}>Step 3: Run the Show</strong> — From the Arena tab, read KBC trivia, view student choice selection in real-time, approve lifelines, lock answers, and advance KBC ladder levels!
                            </li>
                          </ul>
                        </div>

                        {kbcLiveState?.hotseat_attempt ? (
                          <div className="glass-card" style={{
                            background: 'rgba(255, 215, 0, 0.02)',
                            border: '1px solid rgba(255, 215, 0, 0.2)',
                            borderRadius: '12px',
                            padding: '1.5rem 2rem',
                            marginBottom: '2rem',
                            maxWidth: '450px',
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.8rem',
                            textAlign: 'left'
                          }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.5rem', color: '#ffd700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span>👤</span> ACTIVE CONTESTANT PROFILE
                            </h4>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Contender:</span>
                              <strong style={{ color: '#fff' }}>{kbcLiveState.hotseat_attempt.student_name}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Player ID:</span>
                              <strong style={{ color: 'var(--admin-cyan)' }}>{kbcLiveState.hotseat_attempt.player_id}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Current Level:</span>
                              <strong style={{ color: '#ff9800' }}>Question {kbcLiveState.hotseat_attempt.current_question_index + 1}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Current Score:</span>
                              <strong style={{ color: '#4caf50' }}>{kbcLiveState.hotseat_attempt.score} pts</strong>
                            </div>
                          </div>
                        ) : (
                          <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1rem 2rem', borderRadius: '8px', border: '1px dashed rgba(255, 255, 255, 0.15)', color: 'rgba(255,255,255,0.6)', fontWeight: 'bold', marginBottom: '2rem' }}>
                            ⏳ Awaiting promotion / start of active contestant attempt...
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', width: '100%', maxWidth: '650px', margin: '0 auto' }}>
                          {kbcLiveState?.hotseat_attempt && (
                            kbcLiveState.hotseat_attempt.show_intro ? (
                              <button
                                onClick={handleCompleteIntro}
                                className="kbc-advance-btn"
                                style={{
                                  background: 'linear-gradient(135deg, #ff4d4d 0%, #cc0000 100%)',
                                  color: '#fff',
                                  fontWeight: '900',
                                  padding: '1.2rem 2.5rem',
                                  fontSize: '1.15rem',
                                  borderRadius: '8px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  boxShadow: '0 6px 25px rgba(255, 77, 77, 0.35)',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.08em',
                                  flex: 1
                                }}
                              >
                                ⏹️ STOP INTRO PLAYBACK
                              </button>
                            ) : (
                              <button
                                onClick={handleTriggerIntro}
                                className="kbc-advance-btn"
                                style={{
                                  background: 'linear-gradient(135deg, #00bfff 0%, #0080ff 100%)',
                                  color: '#fff',
                                  fontWeight: '900',
                                  padding: '1.2rem 2.5rem',
                                  fontSize: '1.15rem',
                                  borderRadius: '8px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  boxShadow: '0 6px 25px rgba(0, 191, 255, 0.35)',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.08em',
                                  flex: 1
                                }}
                              >
                                🎥 PLAY HOTSEAT INTRO
                              </button>
                            )
                          )}

                          <Link 
                            to={`/quiz-arena/${selectedKbcQuizId}?role=host`} 
                            target="_blank" 
                            className="kbc-advance-btn glow-button"
                            style={{
                              background: 'linear-gradient(135deg, #ffd700 0%, #ffa500 100%)',
                              color: '#000',
                              fontWeight: '900',
                              padding: '1.2rem 2.5rem',
                              fontSize: '1.15rem',
                              borderRadius: '8px',
                              border: 'none',
                              cursor: 'pointer',
                              boxShadow: '0 6px 25px rgba(255, 215, 0, 0.35)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.6rem',
                              textDecoration: 'none',
                              flex: 1
                            }}
                          >
                            🎙️ ENTER HOST ARENA
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Completed Stage */}
                    {kbcQuizDetail?.current_stage === 'completed' && (
                      <div className="kbc-panel context-panel podium-panel">
                        <h3>Event Concluded</h3>
                        <p className="panel-subtitle">All hotseat players have finished. Highest score wins.</p>

                        <div className="podium-showcase">
                          {(() => {
                            const players = [
                              { name: kbcQuizDetail.hotseat_player_1_name || 'Contender 1', score: kbcQuizDetail.hotseat_score_1 || 0 },
                              { name: kbcQuizDetail.hotseat_player_2_name || 'Contender 2', score: kbcQuizDetail.hotseat_score_2 || 0 },
                              { name: kbcQuizDetail.hotseat_player_3_name || 'Contender 3', score: kbcQuizDetail.hotseat_score_3 || 0 }
                            ].sort((a,b) => b.score - a.score);

                            return (
                              <div className="podium-wrapper">
                                {/* Second Place */}
                                <div className="podium-column podium-silver">
                                  <span className="podium-rank">2nd</span>
                                  <span className="podium-player-name">{players[1]?.name}</span>
                                  <span className="podium-player-score">{players[1]?.score} pts</span>
                                  <div className="podium-bar silver-bar"></div>
                                </div>

                                {/* First Place */}
                                <div className="podium-column podium-gold">
                                  <span className="podium-crown font-mono">👑</span>
                                  <span className="podium-rank">1st</span>
                                  <span className="podium-player-name">{players[0]?.name}</span>
                                  <span className="podium-player-score">{players[0]?.score} pts</span>
                                  <div className="podium-bar gold-bar"></div>
                                </div>

                                {/* Third Place */}
                                <div className="podium-column podium-bronze">
                                  <span className="podium-rank">3rd</span>
                                  <span className="podium-player-name">{players[2]?.name}</span>
                                  <span className="podium-player-score">{players[2]?.score} pts</span>
                                  <div className="podium-bar bronze-bar"></div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2.5rem' }}>
                          <button 
                            className="btn-submit" 
                            onClick={() => handleDownloadDetailedReport(kbcQuizDetail.id, kbcQuizDetail.title)}
                            style={{ 
                              background: 'linear-gradient(135deg, #ffd700 0%, #b45309 100%)', 
                              color: '#000', 
                              fontWeight: '900', 
                              padding: '0.9rem 3rem', 
                              borderRadius: '24px', 
                              fontSize: '1rem', 
                              letterSpacing: '0.05em', 
                              border: 'none', 
                              cursor: 'pointer',
                              boxShadow: '0 4px 20px rgba(212,175,55,0.45)',
                              textTransform: 'uppercase',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.03)';
                              e.currentTarget.style.boxShadow = '0 6px 25px rgba(212,175,55,0.6)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = '0 4px 20px rgba(212,175,55,0.45)';
                            }}
                          >
                            📥 Download Detailed Performance Report (PDF)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'Quiz Enrollment' && (
          <section className="admin-overview-hero manage-students-container" style={{ marginTop: '2rem', padding: '2rem' }}>
            <div className="overview-copy" style={{ width: '100%' }}>
              <span className="overview-status" style={{
                background: 'rgba(56, 189, 248, 0.25)',
                border: '2px solid rgba(56, 189, 248, 0.8)',
                color: '#ffffff',
                padding: '0.45rem 1rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                display: 'inline-block',
                marginBottom: '0.5rem',
                boxShadow: '0 0 12px rgba(56, 189, 248, 0.4)',
                textShadow: '0 0 5px rgba(56, 189, 248, 0.8)'
              }}>
                Contestant Registration & Profile Facility
              </span>
              
              {/* Quiz Selection Dropdown Header */}
              <div className="manage-students-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ margin: 0 }}>Manage Enrolled Students</h2>
                <div className="quiz-selector-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <label htmlFor="student-quiz-select" className="admin-form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Active Quiz Sector:</label>
                  <select
                    id="student-quiz-select"
                    className="admin-form-input inline-select"
                    style={{ minWidth: '250px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                    value={selectedEnrollQuizId}
                    onChange={(e) => setSelectedEnrollQuizId(e.target.value)}
                  >
                    <option value="">-- Choose Quiz Sector --</option>
                    {quizzes.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.title} ({q.registered_count} Enrolled)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {!selectedEnrollQuizId ? (
                <div className="no-quiz-selected-state" style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed var(--admin-border)' }}>
                  <p className="no-active-msg" style={{ margin: 0, fontSize: '1.1rem', color: 'var(--admin-muted)' }}>
                    Please select a quiz sector from the dropdown above to manage registrations.
                  </p>
                </div>
              ) : (
                <div className="students-facility-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem', marginTop: '1rem' }}>
                  {/* Left Panel: Direct Single Enrollment Form & Bulk Excel Uploader */}
                  <div className="students-facility-left" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* single manual enrollment card */}
                    <div className="students-panel glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                      <h3 style={{ marginTop: 0, color: 'rgb(var(--admin-cyan-rgb))' }}>Single Contestant Manual Form</h3>
                      <p className="panel-subtitle font-mono" style={{ fontSize: '0.85rem', color: 'var(--admin-muted)', marginBottom: '1.5rem' }}>
                        Provision profile & credentials instantly
                      </p>
                      
                      <form onSubmit={handleEnrollManualSubmit} className="manual-enroll-form" style={{ display: 'grid', gap: '1.2rem' }}>
                        <div className="form-group">
                          <label className="admin-form-label" style={{ color: 'rgb(var(--admin-yellow-rgb))', fontWeight: 'bold' }}>Quick Select Student Account</label>
                          <select
                            className="admin-form-input"
                            style={{ border: '1px solid rgba(var(--admin-yellow-rgb), 0.35)', background: 'rgba(0,0,0,0.2)' }}
                            value={allStudents.find(s => s.roll_number === enrollForm.rollNumber)?.id || ''}
                            onChange={(e) => {
                              const selectedId = e.target.value;
                              if (!selectedId) {
                                setEnrollForm({
                                  ...enrollForm,
                                  fullName: '',
                                  email: '',
                                  rollNumber: ''
                                });
                                return;
                              }
                              const student = allStudents.find(s => String(s.id) === String(selectedId));
                              if (student) {
                                setEnrollForm({
                                  ...enrollForm,
                                  fullName: student.full_name,
                                  email: student.email,
                                  rollNumber: student.roll_number
                                });
                              }
                            }}
                          >
                            <option value="">-- Choose From Pre-registered Students --</option>
                            {allStudents
                              .filter(s => !enrolledStudents.some(es => es.roll_number === s.roll_number))
                              .map(s => (
                                <option key={s.id} value={s.id}>
                                  {s.full_name} ({s.roll_number})
                                </option>
                              ))
                            }
                          </select>
                          <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.75rem', color: 'var(--admin-muted)' }}>
                            Choose an existing student to instantly pre-fill their profile credentials.
                          </p>
                        </div>

                        <div className="form-group">
                          <label className="admin-form-label">Full Name</label>
                          <input
                            required
                            type="text"
                            className="admin-form-input"
                            placeholder="e.g. Sanjana Prasad"
                            value={enrollForm.fullName}
                            onChange={(e) => setEnrollForm({ ...enrollForm, fullName: e.target.value })}
                          />
                        </div>

                        <div className="form-group">
                          <label className="admin-form-label">Email Address</label>
                          <input
                            required
                            type="email"
                            className="admin-form-input"
                            placeholder="sanjana@domain.com"
                            value={enrollForm.email}
                            onChange={(e) => setEnrollForm({ ...enrollForm, email: e.target.value })}
                          />
                        </div>

                        <div className="form-group">
                          <label className="admin-form-label">Roll Number</label>
                          <input
                            required
                            type="text"
                            className="admin-form-input"
                            placeholder="e.g. ROLL001"
                            value={enrollForm.rollNumber}
                            onChange={(e) => setEnrollForm({ ...enrollForm, rollNumber: e.target.value })}
                          />
                        </div>

                        <div className="form-group">
                          <label className="admin-form-label">Mock Payment Status</label>
                          <select
                            className="admin-form-input"
                            value={enrollForm.paymentStatus}
                            onChange={(e) => setEnrollForm({ ...enrollForm, paymentStatus: e.target.value })}
                          >
                            <option value="paid">Paid (Instant Arena Access)</option>
                            <option value="pending">Pending (Awaiting Mock Payment)</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          className="dash-chip-btn submit-enroll-btn"
                          disabled={enrollLoading}
                          style={{ background: 'rgb(var(--admin-cyan-rgb))', color: '#000', border: 'none', fontWeight: 'bold', padding: '1rem', cursor: 'pointer', borderRadius: '4px', marginTop: '0.5rem', width: '100%' }}
                        >
                          {enrollLoading ? 'PROVISIONING...' : 'ENROLL CONTESTANT 🚀'}
                        </button>
                      </form>
                    </div>

                  </div>

                  {/* Right Panel: Enrolled Students List Roster */}
                  <div className="students-facility-right">
                    <div className="students-panel glass-card roster-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--admin-border)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <div className="panel-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                          <h3 style={{ margin: 0, color: 'rgb(var(--admin-yellow-rgb))' }}>Registered Roster</h3>
                          <p className="panel-subtitle" style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--admin-muted)' }}>
                            Total enrolled: {enrolledStudents.length} contestants
                          </p>
                        </div>
                        {enrollLoading && <span className="roster-syncing" style={{ fontSize: '0.8rem', color: 'rgb(var(--admin-cyan-rgb))', animation: 'pulse 1.5s infinite' }}>Syncing...</span>}
                      </div>

                      <div className="roster-table-container" style={{ overflowY: 'auto', maxHeight: '680px', border: '1px solid var(--admin-border)', borderRadius: '6px' }}>
                        <table className="kbc-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--admin-border)' }}>
                              <th style={{ padding: '1rem' }}>Seq</th>
                              <th style={{ padding: '1rem' }}>Player ID</th>
                              <th style={{ padding: '1rem' }}>Name & Email</th>
                              <th style={{ padding: '1rem' }}>Roll Number</th>
                              <th style={{ padding: '1rem' }}>Payment</th>
                              <th style={{ padding: '1rem' }}>Registered At</th>
                              <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {enrolledStudents.length === 0 ? (
                              <tr>
                                <td colSpan="7" className="text-center" style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--admin-muted)', fontStyle: 'italic' }}>
                                  No registered contestants found in this sector yet.<br/>
                                  Use the forms on the left to add students.
                                </td>
                              </tr>
                            ) : (
                              enrolledStudents.map((studentReg) => (
                                <tr key={studentReg.id} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                                  <td className="font-mono" style={{ padding: '1rem' }}>#{studentReg.sequence_number || studentReg.id}</td>
                                  <td className="text-cyan font-bold font-mono" style={{ padding: '1rem', color: 'rgb(var(--admin-cyan-rgb))' }}>{studentReg.player_id}</td>
                                  <td style={{ padding: '1rem' }}>
                                    <div className="roster-student-details" style={{ display: 'flex', flexDirection: 'column' }}>
                                      <strong className="text-gold" style={{ color: 'rgb(var(--admin-yellow-rgb))' }}>{studentReg.student_name}</strong>
                                      <span className="roster-email" style={{ fontSize: '0.8rem', color: 'var(--admin-muted)' }}>{studentReg.student_email}</span>
                                    </div>
                                  </td>
                                  <td className="font-mono" style={{ padding: '1rem', fontSize: '0.85rem' }}>{studentReg.college_id || '-'}</td>
                                  <td style={{ padding: '1rem' }}>
                                    <span 
                                      className={`badge-payment ${studentReg.payment_status}`}
                                      style={{
                                        display: 'inline-block',
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold',
                                        background: studentReg.payment_status === 'paid' ? 'rgba(152,255,152,0.15)' : 'rgba(255,223,137,0.15)',
                                        color: studentReg.payment_status === 'paid' ? '#98ff98' : '#ffdf89',
                                        border: studentReg.payment_status === 'paid' ? '1px solid rgba(152,255,152,0.3)' : '1px solid rgba(255,223,137,0.3)'
                                      }}
                                    >
                                      {studentReg.payment_status.toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="font-mono" style={{ padding: '1rem', fontSize: '0.85rem' }}>
                                    {new Date(studentReg.registered_at).toLocaleString()}
                                  </td>
                                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <button
                                      className="roster-remove-btn"
                                      onClick={() => handleRemoveRegistration(studentReg.id, studentReg.student_name)}
                                      disabled={enrollLoading}
                                      style={{
                                        background: 'rgba(255, 99, 71, 0.1)',
                                        border: '1px solid rgba(255, 99, 71, 0.35)',
                                        color: '#ff6347',
                                        padding: '0.35rem 0.75rem',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        fontWeight: '800',
                                        cursor: enrollLoading ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s ease',
                                        fontFamily: 'monospace',
                                        letterSpacing: '0.03em',
                                        opacity: enrollLoading ? 0.5 : 1
                                      }}
                                      onMouseOver={(e) => { if (!enrollLoading) { e.currentTarget.style.background = 'rgba(255, 99, 71, 0.25)'; e.currentTarget.style.boxShadow = '0 0 10px rgba(255, 99, 71, 0.3)'; }}}
                                      onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 99, 71, 0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                                    >
                                      🗑️ REMOVE
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'Student Accounts' && (() => {
          const filteredStudents = allStudents.filter(student => {
            if (filterSchoolId && student.school_id?.toString() !== filterSchoolId.toString()) {
              return false;
            }
            if (filterProgramId && student.program_id?.toString() !== filterProgramId.toString()) {
              return false;
            }
            if (filterBranchId && student.branch_id?.toString() !== filterBranchId.toString()) {
              return false;
            }

            const q = studentSearchQuery.toLowerCase();
            if (!q) return true;
            return (
              student.full_name?.toLowerCase().includes(q) ||
              student.roll_number?.toLowerCase().includes(q) ||
              student.college_id?.toLowerCase().includes(q) ||
              student.email?.toLowerCase().includes(q) ||
              student.school?.toLowerCase().includes(q) ||
              student.program?.toLowerCase().includes(q) ||
              student.branch?.toLowerCase().includes(q)
            );
          });

          return (
            <section className="admin-overview-hero" style={{ marginTop: '2rem', padding: '2rem' }}>
              <div className="overview-copy" style={{ width: '100%' }}>
                <span className="overview-status" style={{
                  background: 'rgba(56, 189, 248, 0.25)',
                  border: '2px solid rgba(56, 189, 248, 0.8)',
                  color: '#ffffff',
                  padding: '0.45rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  display: 'inline-block',
                  marginBottom: '0.5rem',
                  boxShadow: '0 0 12px rgba(56, 189, 248, 0.4)',
                  textShadow: '0 0 5px rgba(56, 189, 248, 0.8)'
                }}>
                  Student Account Management
                </span>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <h2 style={{ margin: 0 }}>Student Accounts</h2>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      className="dash-chip-btn"
                      onClick={() => { setShowAddStudentForm(!showAddStudentForm); }}
                      style={{ background: 'rgb(var(--admin-cyan-rgb))', color: '#000', border: 'none', fontWeight: 'bold', padding: '0.75rem 1.5rem', cursor: 'pointer', borderRadius: '6px', fontSize: '0.85rem' }}
                    >
                      {showAddStudentForm ? '✕ CLOSE FORM' : '+ ADD STUDENT'}
                    </button>
                    <button
                      className="dash-chip-btn"
                      onClick={handleDownloadStudentTemplate}
                      style={{ background: 'transparent', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', padding: '0.75rem 1.5rem', cursor: 'pointer', borderRadius: '6px', fontSize: '0.85rem' }}
                    >
                      <DownloadIcon size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> DOWNLOAD TEMPLATE
                    </button>
                  </div>
                </div>

                {/* Add Single Student Form */}
                {showAddStudentForm && (
                  <div className="students-panel glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--admin-border)', marginBottom: '2rem' }}>
                    <h3 style={{ marginTop: 0, color: 'rgb(var(--admin-cyan-rgb))' }}>Add New Student</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--admin-muted)', marginBottom: '1.5rem' }}>
                      Default password: <strong style={{ color: 'rgb(var(--admin-yellow-rgb))' }}>itmu@123</strong> — Students can change it from their dashboard.
                    </p>

                    <form onSubmit={handleAddStudentSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="admin-form-label">Full Name</label>
                        <input required type="text" className="admin-form-input" placeholder="e.g. Sanjana Prasad"
                          value={addStudentForm.full_name} onChange={(e) => setAddStudentForm({ ...addStudentForm, full_name: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="admin-form-label">Roll Number</label>
                        <input required type="text" className="admin-form-input" placeholder="e.g. ROLL001"
                          value={addStudentForm.roll_number} onChange={(e) => setAddStudentForm({ ...addStudentForm, roll_number: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="admin-form-label">Email</label>
                        <input required type="email" className="admin-form-input" placeholder="student@college.edu"
                          value={addStudentForm.email} onChange={(e) => setAddStudentForm({ ...addStudentForm, email: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="admin-form-label">School</label>
                        <select required className="admin-form-input" value={addStudentForm.school}
                          disabled={!session?.user?.is_super_admin}
                          onChange={(e) => setAddStudentForm({ ...addStudentForm, school: e.target.value, program: '', branch: '' })}
                          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', opacity: !session?.user?.is_super_admin ? 0.7 : 1 }}>
                          <option value="">Select School</option>
                          {addStudentSchools.map(s => <option key={s.id} value={s.id}>{s.school_name} ({s.school_code})</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="admin-form-label">Program</label>
                        <select required className="admin-form-input" value={addStudentForm.program} disabled={!addStudentForm.school}
                          onChange={(e) => setAddStudentForm({ ...addStudentForm, program: e.target.value, branch: '' })}
                          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}>
                          <option value="">{addStudentForm.school ? 'Select Program' : 'Select School First'}</option>
                          {addStudentPrograms.map(p => <option key={p.id} value={p.id}>{p.program_name} ({p.program_code})</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="admin-form-label">Branch</label>
                        <select required className="admin-form-input" value={addStudentForm.branch} disabled={!addStudentForm.program}
                          onChange={(e) => setAddStudentForm({ ...addStudentForm, branch: e.target.value })}
                          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}>
                          <option value="">{addStudentForm.program ? 'Select Branch' : 'Select Program First'}</option>
                          {addStudentBranches.map(b => <option key={b.id} value={b.id}>{b.branch_name} ({b.branch_code})</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="admin-form-label">Year</label>
                        <select required className="admin-form-input" value={addStudentForm.year}
                          onChange={(e) => setAddStudentForm({ ...addStudentForm, year: e.target.value })}
                          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}>
                          <option value="1">1st Year</option>
                          <option value="2">2nd Year</option>
                          <option value="3">3rd Year</option>
                          <option value="4">4th Year</option>
                        </select>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <button type="submit" disabled={addStudentLoading}
                          style={{ width: '100%', padding: '1rem', background: 'rgb(var(--admin-cyan-rgb))', color: '#000', border: 'none', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer', fontSize: '0.95rem' }}>
                          {addStudentLoading ? 'CREATING...' : 'CREATE STUDENT ACCOUNT'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Bulk Upload Section */}
                <div className="students-panel glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--admin-border)', marginBottom: '2rem' }}>
                  <h3 style={{ marginTop: 0, color: 'rgb(var(--admin-pink-rgb))' }}>Bulk Upload Students</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--admin-muted)', marginBottom: '1rem' }}>
                    Upload an Excel file (.xlsx) with columns: <strong>Full Name, Roll Number, Email, School, Program, Branch, Year</strong>
                  </p>
                  <form onSubmit={handleStudentBulkUpload} style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '250px' }}>
                      <div style={{ border: '2px dashed var(--admin-border)', padding: '1.5rem', borderRadius: '8px', textAlign: 'center', background: 'rgba(0,0,0,0.1)' }}>
                        <input id="student-bulk-file-input" type="file" accept=".xlsx" onChange={(e) => setStudentBulkFile(e.target.files?.[0] || null)}
                          style={{ display: 'none' }} />
                        <label htmlFor="student-bulk-file-input" style={{ cursor: 'pointer', color: 'rgb(var(--admin-cyan-rgb))', fontWeight: 'bold' }}>
                          {studentBulkFile ? <><FolderIcon size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> Selected: {studentBulkFile.name}</> : <><FolderIcon size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> CLICK TO SELECT EXCEL FILE</>}
                        </label>
                      </div>
                    </div>
                    <button type="submit" disabled={studentBulkLoading || !studentBulkFile}
                      className="dash-chip-btn"
                      style={{ background: 'rgb(var(--admin-pink-rgb))', color: '#000', border: 'none', fontWeight: 'bold', padding: '1.25rem 2rem', borderRadius: '6px', fontSize: '0.85rem', cursor: (studentBulkLoading || !studentBulkFile) ? 'not-allowed' : 'pointer' }}>
                      {studentBulkLoading ? 'UPLOADING...' : <><LightningIcon size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> UPLOAD & PROCESS</>}
                    </button>
                  </form>

                  {studentBulkResult && (
                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--admin-border)', borderRadius: '6px' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: 'rgb(var(--admin-cyan-rgb))' }}>Upload Results</h4>
                      <p style={{ margin: '0.2rem 0', fontSize: '0.85rem' }}>Created: <strong>{studentBulkResult.created}</strong> | Skipped: <strong>{studentBulkResult.skipped}</strong></p>
                      {studentBulkResult.errors && studentBulkResult.errors.length > 0 && (
                        <div style={{ marginTop: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
                          <span style={{ fontSize: '0.8rem', color: '#ff6b6b', fontWeight: 'bold' }}>Errors/Warnings:</span>
                          <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '1.25rem', fontSize: '0.8rem', color: '#ff8787' }}>
                            {studentBulkResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Student Accounts Search and Table list */}
                <div className="students-panel glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h3 style={{ margin: 0, color: 'var(--admin-text)' }}>Pre-registered Students ({filteredStudents.length} / {allStudents.length})</h3>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="Search by name, roll no, email, school..."
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      style={{ maxWidth: '300px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', borderRadius: '4px', padding: '0.5rem 1rem' }}
                    />
                  </div>

                  {/* Structured Academic Filters */}
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '6px', border: '1px solid var(--admin-border)' }}>
                    {session?.user?.is_super_admin ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '180px', flex: 1 }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--admin-muted)', fontWeight: 'bold' }}>Filter by School</label>
                        <select
                          className="admin-form-input"
                          value={filterSchoolId}
                          onChange={(e) => setFilterSchoolId(e.target.value)}
                          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', borderRadius: '4px', padding: '0.4rem 0.75rem' }}
                        >
                          <option value="">-- All Schools --</option>
                          {addStudentSchools.map(s => <option key={s.id} value={s.id}>{s.school_name} ({s.school_code})</option>)}
                        </select>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '180px', flex: 1 }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--admin-muted)', fontWeight: 'bold' }}>School</label>
                        <input
                          type="text"
                          disabled
                          className="admin-form-input"
                          value={session?.user?.school_name || session?.user?.school || ''}
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--admin-border)', color: 'var(--admin-muted)', borderRadius: '4px', padding: '0.4rem 0.75rem', cursor: 'not-allowed' }}
                        />
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '180px', flex: 1 }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--admin-muted)', fontWeight: 'bold' }}>Filter by Program</label>
                      <select
                        className="admin-form-input"
                        disabled={!filterSchoolId}
                        value={filterProgramId}
                        onChange={(e) => setFilterProgramId(e.target.value)}
                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', borderRadius: '4px', padding: '0.4rem 0.75rem' }}
                      >
                        <option value="">-- All Programs --</option>
                        {filterProgramsList.map(p => <option key={p.id} value={p.id}>{p.program_name} ({p.program_code})</option>)}
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '180px', flex: 1 }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--admin-muted)', fontWeight: 'bold' }}>Filter by Branch</label>
                      <select
                        className="admin-form-input"
                        disabled={!filterProgramId}
                        value={filterBranchId}
                        onChange={(e) => setFilterBranchId(e.target.value)}
                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', borderRadius: '4px', padding: '0.4rem 0.75rem' }}
                      >
                        <option value="">-- All Branches --</option>
                        {filterBranchesList.map(b => <option key={b.id} value={b.id}>{b.branch_name} ({b.branch_code})</option>)}
                      </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', marginTop: 'auto' }}>
                      {(filterSchoolId || filterProgramId || filterBranchId) && (
                        <button
                          type="button"
                          className="dash-chip-btn"
                          onClick={() => {
                            if (session?.user?.is_super_admin) {
                              setFilterSchoolId('');
                            } else {
                              setFilterProgramId('');
                              setFilterBranchId('');
                            }
                          }}
                          style={{ background: 'rgba(255,80,80,0.15)', color: '#ff5050', border: '1px solid rgba(255,80,80,0.3)', fontWeight: 'bold', padding: '0.5rem 1rem', cursor: 'pointer', borderRadius: '4px', fontSize: '0.8rem' }}
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </div>

                  {studentsLoading ? (
                    <p style={{ color: 'var(--admin-muted)', textAlign: 'center', padding: '2rem' }}>Scanning contestant databases...</p>
                  ) : filteredStudents.length === 0 ? (
                    <p style={{ color: 'var(--admin-muted)', textAlign: 'center', padding: '2rem', fontStyle: 'italic' }}>
                      No student accounts found matching the criteria.
                    </p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="admin-results-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--admin-border)' }}>
                            <th style={{ padding: '0.75rem' }}>Name</th>
                            <th style={{ padding: '0.75rem' }}>Roll Number</th>
                            <th style={{ padding: '0.75rem' }}>Email</th>
                            <th style={{ padding: '0.75rem' }}>Academic Sector</th>
                            <th style={{ padding: '0.75rem' }}>Year</th>
                            <th style={{ padding: '0.75rem' }}>Status</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map((st) => (
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', verticalAlign: 'middle' }} key={st.id}>
                              <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{st.full_name}</td>
                              <td style={{ padding: '0.75rem' }}>{st.roll_number || '-'}</td>
                              <td style={{ padding: '0.75rem' }}>{st.email}</td>
                              <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: 'var(--admin-muted)' }}>
                                {st.school} / {st.program} / {st.branch}
                              </td>
                              <td style={{ padding: '0.75rem' }}>{st.year} Yr</td>
                              <td style={{ padding: '0.75rem' }}>
                                <span style={{ fontSize: '0.75rem', background: st.is_active ? 'rgba(56,176,0,0.15)' : 'rgba(255,80,80,0.15)', color: st.is_active ? '#38b000' : '#ff5050', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>
                                  {st.is_active ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                  <button
                                    onClick={() => startEditStudent(st)}
                                    style={{
                                      padding: '0.4rem 0.8rem',
                                      fontSize: '0.75rem',
                                      background: 'rgba(var(--admin-cyan-rgb), 0.1)',
                                      border: '1px solid rgba(var(--admin-cyan-rgb), 0.3)',
                                      color: 'rgb(var(--admin-cyan-rgb))',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontWeight: 'bold',
                                      marginRight: '0.5rem',
                                      transition: 'all 0.2s ease'
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(var(--admin-cyan-rgb), 0.25)'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(var(--admin-cyan-rgb), 0.1)'; }}
                                  >
                                    <EditIcon size={12} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} /> EDIT
                                  </button>
                                  <button
                                    onClick={() => handleDeleteStudent(st.id, st.full_name)}
                                    style={{
                                      padding: '0.4rem 0.8rem',
                                      fontSize: '0.75rem',
                                      background: 'rgba(255, 80, 80, 0.1)',
                                      border: '1px solid rgba(255, 80, 80, 0.3)',
                                      color: '#ff5050',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontWeight: 'bold',
                                      transition: 'all 0.2s ease'
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 80, 80, 0.25)'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 80, 80, 0.1)'; }}
                                  >
                                    <TrashIcon size={12} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} /> DELETE
                                  </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Edit Student Modal */}
              {showEditStudentModal && (
                <div className="password-modal-overlay" style={{
                  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 9999,
                }}>
                  <div className="password-modal" style={{
                    background: 'rgba(20, 20, 35, 0.95)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '640px',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.5)', boxSizing: 'border-box'
                  }}>
                    <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem', color: '#fff' }}>✏️ Edit Student Details</h2>
                    <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.85rem', color: 'var(--admin-muted)' }}>
                      Update student credentials and academic sector.
                    </p>

                    <form onSubmit={handleEditStudentSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="admin-form-label">Full Name</label>
                        <input required type="text" className="admin-form-input" style={{ width: '100%', boxSizing: 'border-box' }}
                          value={editStudentForm.full_name} onChange={(e) => setEditStudentForm({ ...editStudentForm, full_name: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="admin-form-label">Roll Number</label>
                        <input required type="text" className="admin-form-input" style={{ width: '100%', boxSizing: 'border-box' }}
                          value={editStudentForm.roll_number} onChange={(e) => setEditStudentForm({ ...editStudentForm, roll_number: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="admin-form-label">Email</label>
                        <input required type="email" className="admin-form-input" style={{ width: '100%', boxSizing: 'border-box' }}
                          value={editStudentForm.email} onChange={(e) => setEditStudentForm({ ...editStudentForm, email: e.target.value })} />
                      </div>
                       <div className="form-group">
                        <label className="admin-form-label">School</label>
                        <select required className="admin-form-input" value={editStudentForm.school}
                          disabled={!session?.user?.is_super_admin}
                          onChange={(e) => setEditStudentForm({ ...editStudentForm, school: e.target.value, program: '', branch: '' })}
                          style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', boxSizing: 'border-box', opacity: !session?.user?.is_super_admin ? 0.7 : 1 }}>
                          <option value="">Select School</option>
                          {addStudentSchools.map(s => <option key={s.id} value={s.id}>{s.school_name} ({s.school_code})</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="admin-form-label">Program</label>
                        <select required className="admin-form-input" value={editStudentForm.program} disabled={!editStudentForm.school}
                          onChange={(e) => setEditStudentForm({ ...editStudentForm, program: e.target.value, branch: '' })}
                          style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', boxSizing: 'border-box' }}>
                          <option value="">{editStudentForm.school ? 'Select Program' : 'Select School First'}</option>
                          {editStudentPrograms.map(p => <option key={p.id} value={p.id}>{p.program_name} ({p.program_code})</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="admin-form-label">Branch</label>
                        <select required className="admin-form-input" value={editStudentForm.branch} disabled={!editStudentForm.program}
                          onChange={(e) => setEditStudentForm({ ...editStudentForm, branch: e.target.value })}
                          style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', boxSizing: 'border-box' }}>
                          <option value="">{editStudentForm.program ? 'Select Branch' : 'Select Program First'}</option>
                          {editStudentBranches.map(b => <option key={b.id} value={b.id}>{b.branch_name} ({b.branch_code})</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="admin-form-label">Year</label>
                        <select required className="admin-form-input" value={editStudentForm.year}
                          onChange={(e) => setEditStudentForm({ ...editStudentForm, year: e.target.value })}
                          style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', boxSizing: 'border-box' }}>
                          <option value="1">1st Year</option>
                          <option value="2">2nd Year</option>
                          <option value="3">3rd Year</option>
                          <option value="4">4th Year</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <input type="checkbox" id="edit-is-active" checked={editStudentForm.is_active}
                          onChange={(e) => setEditStudentForm({ ...editStudentForm, is_active: e.target.checked })}
                          style={{ cursor: 'pointer', width: '18px', height: '18px' }} />
                        <label htmlFor="edit-is-active" style={{ cursor: 'pointer', fontSize: '0.9rem', color: '#fff', fontWeight: 'bold' }}>Contestant Account Active</label>
                      </div>
                      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                        <button type="button" onClick={() => { setShowEditStudentModal(false); setEditingStudent(null); }}
                          className="dash-chip-btn"
                          style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', borderRadius: '6px' }}
                        >CANCEL</button>
                        <button type="submit" disabled={editStudentLoading}
                          className="dash-chip-btn"
                          style={{ flex: 1, padding: '0.75rem', background: 'rgb(var(--admin-cyan-rgb))', color: '#000', border: 'none', borderRadius: '6px', fontSize: '0.9rem', fontWeight: '700', cursor: editStudentLoading ? 'wait' : 'pointer' }}
                        >{editStudentLoading ? 'SAVING...' : 'SAVE CHANGES'}</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </section>
          );
        })()}

        {activeTab === 'Manage School Admins' && (
          <section className="admin-overview-hero" style={{ marginTop: '2rem', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'stretch' }}>
            <div className="overview-copy" style={{ width: '100%' }}>
              <span className="overview-status" style={{
                background: 'rgba(56, 189, 248, 0.25)',
                border: '2px solid rgba(56, 189, 248, 0.8)',
                color: '#ffffff',
                padding: '0.45rem 1rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                display: 'inline-block',
                marginBottom: '0.5rem',
                boxShadow: '0 0 12px rgba(56, 189, 248, 0.4)',
                textShadow: '0 0 5px rgba(56, 189, 248, 0.8)'
              }}>
                <KeyIcon size={12} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> SUPER ADMIN CONTROL STATION
              </span>
              <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '900' }}>Manage School Administrators</h2>
              <p style={{ margin: '0.2rem 0 2rem 0', fontSize: '1rem', color: 'var(--admin-muted)' }}>
                Create, update, delete school-specific administrators, configure tenant isolation constraints, and monitor credential records.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
                
                {/* School Admin Creator / Editor Form */}
                <div className="kbc-panel" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '2rem' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: 'rgb(var(--admin-yellow-rgb))', fontSize: '1.2rem', fontWeight: 'bold' }}>
                    {editingAdminId ? '📝 Edit Administrator Account' : <><PlusIcon size={18} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> Create School Administrator</>}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--admin-muted)', marginBottom: '1.5rem' }}>
                    {editingAdminId ? 'Modify profile credentials and target school association parameters.' : 'Register a new administrative authority with credentials and school boundaries.'}
                  </p>

                  <form onSubmit={handleAdminSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                      <label className="admin-form-label">Full Name</label>
                      <input 
                        required 
                        type="text" 
                        placeholder="e.g. John Doe"
                        className="admin-form-input" 
                        value={adminForm.full_name} 
                        onChange={e => setAdminForm({...adminForm, full_name: e.target.value})} 
                      />
                    </div>

                    <div>
                      <label className="admin-form-label">Email Address</label>
                      <input 
                        required 
                        type="email" 
                        placeholder="e.g. admin@school.edu"
                        className="admin-form-input" 
                        value={adminForm.email} 
                        onChange={e => setAdminForm({...adminForm, email: e.target.value})} 
                      />
                    </div>

                    <div>
                      <label className="admin-form-label">College ID</label>
                      <input 
                        required 
                        type="text" 
                        placeholder="e.g. ADM1001"
                        className="admin-form-input" 
                        value={adminForm.college_id} 
                        onChange={e => setAdminForm({...adminForm, college_id: e.target.value})} 
                      />
                    </div>

                    <div>
                      <label className="admin-form-label">
                        {editingAdminId ? 'Password (leave blank to keep unchanged)' : 'Login Password'}
                      </label>
                      <input 
                        required={!editingAdminId}
                        type="password" 
                        placeholder="********"
                        className="admin-form-input" 
                        value={adminForm.password} 
                        onChange={e => setAdminForm({...adminForm, password: e.target.value})} 
                      />
                    </div>

                    <div>
                      <label className="admin-form-label">Assigned School Bound</label>
                      <select 
                        required={!adminForm.is_super_admin}
                        disabled={adminForm.is_super_admin}
                        className="admin-form-input" 
                        value={adminForm.school_id} 
                        onChange={e => setAdminForm({...adminForm, school_id: e.target.value})}
                      >
                        <option value="">-- Select Target School --</option>
                        {schools.map(s => (
                          <option key={s.id} value={s.id}>{s.school_name} ({s.school_code})</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <input 
                        type="checkbox" 
                        id="is_super_admin" 
                        checked={adminForm.is_super_admin} 
                        onChange={e => {
                          const checked = e.target.checked;
                          setAdminForm({
                            ...adminForm,
                            is_super_admin: checked,
                            school_id: checked ? '' : adminForm.school_id
                          });
                        }} 
                      />
                      <label htmlFor="is_super_admin" style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
                        Grant Global Super Admin Privileges
                      </label>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                      {editingAdminId && (
                        <button 
                          type="button" 
                          onClick={() => {
                            setEditingAdminId(null);
                            setAdminForm({ full_name: '', email: '', college_id: '', password: '', school_id: '', is_super_admin: false });
                          }}
                          className="dash-chip-btn"
                          style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          CANCEL
                        </button>
                      )}
                      <button 
                        type="submit" 
                        disabled={adminSubmitLoading}
                        className="dash-chip-btn"
                        style={{ flex: 2, padding: '0.75rem', background: 'rgb(var(--admin-yellow-rgb))', color: '#000', border: 'none', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 'bold', cursor: adminSubmitLoading ? 'wait' : 'pointer' }}
                      >
                        {adminSubmitLoading ? 'SAVING...' : editingAdminId ? 'UPDATE ACCOUNT' : 'CREATE ACCOUNT'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Administrators Accounts List Table */}
                <div className="kbc-panel" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '2rem' }}>
                  <h3 style={{ margin: '0 0 1rem 0', color: 'rgb(var(--admin-cyan-rgb))', fontSize: '1.25rem', fontWeight: 'bold' }}><AdminsIcon size={18} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> Administrator Credential Directory</h3>
                  
                  <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--admin-border)' }}>
                          <th style={{ padding: '0.75rem 0.5rem', color: 'var(--admin-muted)', fontSize: '0.85rem' }}>Name</th>
                          <th style={{ padding: '0.75rem 0.5rem', color: 'var(--admin-muted)', fontSize: '0.85rem' }}>Email</th>
                          <th style={{ padding: '0.75rem 0.5rem', color: 'var(--admin-muted)', fontSize: '0.85rem' }}>College ID</th>
                          <th style={{ padding: '0.75rem 0.5rem', color: 'var(--admin-muted)', fontSize: '0.85rem' }}>Assigned School</th>
                          <th style={{ padding: '0.75rem 0.5rem', color: 'var(--admin-muted)', fontSize: '0.85rem' }}>Visible Password</th>
                          <th style={{ padding: '0.75rem 0.5rem', color: 'var(--admin-muted)', fontSize: '0.85rem', textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminsList.length === 0 ? (
                          <tr>
                            <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--admin-muted)', fontStyle: 'italic' }}>
                              No administrative records found.
                            </td>
                          </tr>
                        ) : (
                          adminsList.map(adm => (
                            <tr key={adm.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                {adm.full_name} {adm.is_super_admin && <span style={{ color: 'rgb(var(--admin-cyan-rgb))', fontSize: '0.75rem', background: 'rgba(0,188,212,0.15)', padding: '0.15rem 0.35rem', borderRadius: '4px', marginLeft: '0.35rem' }}>Super</span>}
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.85rem', color: 'var(--admin-muted)' }}>{adm.email}</td>
                              <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.85rem' }}>{adm.college_id}</td>
                              <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.85rem' }}>
                                <span style={{ color: adm.is_super_admin ? 'rgb(var(--admin-cyan-rgb))' : 'rgb(var(--admin-yellow-rgb))' }}>
                                  {adm.school_name || 'Global'}
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.85rem', fontFamily: 'monospace', color: 'rgb(var(--admin-yellow-rgb))', fontWeight: 'bold' }}>
                                {adm.cleartext_password || <><AdminsIcon size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} /> encrypted</>}
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                  <button 
                                    onClick={() => handleAdminEditClick(adm)}
                                    title="Edit Admin"
                                    style={{ background: 'rgba(0,188,212,0.1)', border: '1px solid rgba(0,188,212,0.25)', color: 'rgb(var(--admin-cyan-rgb))', padding: '0.35rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                                  >
                                    <EditIcon size={12} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} /> Edit
                                  </button>
                                  <button 
                                    onClick={() => handleAdminDeleteClick(adm.id)}
                                    disabled={adm.id === session?.user?.id}
                                    title={adm.id === session?.user?.id ? "You cannot delete yourself" : "Delete Admin"}
                                    style={{ background: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.25)', color: '#ff5252', padding: '0.35rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', cursor: adm.id === session?.user?.id ? 'not-allowed' : 'pointer', opacity: adm.id === session?.user?.id ? 0.5 : 1 }}
                                  >
                                    <TrashIcon size={12} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} /> Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          </section>
        )}

        {activeTab === 'System Settings' && (
          <section className="admin-overview-hero" style={{ marginTop: '2rem', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'stretch' }}>
            <div className="overview-copy" style={{ width: '100%' }}>
              <span className="overview-status" style={{
                background: 'rgba(56, 189, 248, 0.25)',
                border: '2px solid rgba(56, 189, 248, 0.8)',
                color: '#ffffff',
                padding: '0.45rem 1rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                display: 'inline-block',
                marginBottom: '0.5rem',
                boxShadow: '0 0 12px rgba(56, 189, 248, 0.4)',
                textShadow: '0 0 5px rgba(56, 189, 248, 0.8)'
              }}>
                <SettingsIcon size={12} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> SYSTEM OPERATIONS PANEL
              </span>
              <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '900' }}>System Settings & Preferences</h2>
              <p style={{ margin: '0.2rem 0 2rem 0', fontSize: '1rem', color: 'var(--admin-muted)' }}>
                Configure global live tournament thresholds, manage student registrations behaviors, and update administrator profile credentials safely.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Profile Credentials Settings Card */}
                <div className="kbc-panel" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '2rem' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: 'rgb(var(--admin-cyan-rgb))', fontSize: '1.25rem', fontWeight: 'bold' }}><StudentsIcon size={18} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> Update Administrator Profile</h3>
                  <p className="panel-subtitle" style={{ fontSize: '0.85rem', color: 'var(--admin-muted)', marginBottom: '1.5rem' }}>
                    Modify your contact email address and change login credentials secure validation.
                  </p>

                  <form onSubmit={handleSaveSettingsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div className="form-group" style={{ textAlign: 'left' }}>
                      <label className="admin-form-label" style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--admin-muted)' }}>Contact Email</label>
                      <input 
                        required
                        type="email"
                        placeholder="admin@quizverse.com"
                        className="admin-form-input"
                        value={settingsForm.email}
                        onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', padding: '0.8rem', borderRadius: '6px', width: '100%' }}
                      />
                    </div>

                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '0.5rem 0' }} />

                    <div className="form-group" style={{ textAlign: 'left' }}>
                      <label className="admin-form-label" style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--admin-muted)' }}>Current Password</label>
                      <input 
                        type="password"
                        placeholder="••••••••"
                        className="admin-form-input"
                        value={settingsForm.currentPassword}
                        onChange={(e) => setSettingsForm({ ...settingsForm, currentPassword: e.target.value })}
                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', padding: '0.8rem', borderRadius: '6px', width: '100%' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group" style={{ textAlign: 'left' }}>
                        <label className="admin-form-label" style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--admin-muted)' }}>New Password</label>
                        <input 
                          type="password"
                          placeholder="Min 8 chars"
                          className="admin-form-input"
                          value={settingsForm.newPassword}
                          onChange={(e) => setSettingsForm({ ...settingsForm, newPassword: e.target.value })}
                          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', padding: '0.8rem', borderRadius: '6px', width: '100%' }}
                        />
                      </div>

                      <div className="form-group" style={{ textAlign: 'left' }}>
                        <label className="admin-form-label" style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--admin-muted)' }}>Confirm New Password</label>
                        <input 
                          type="password"
                          placeholder="••••••••"
                          className="admin-form-input"
                          value={settingsForm.confirmNewPassword}
                          onChange={(e) => setSettingsForm({ ...settingsForm, confirmNewPassword: e.target.value })}
                          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', padding: '0.8rem', borderRadius: '6px', width: '100%' }}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="dash-chip-btn submit-enroll-btn"
                      disabled={settingsLoading}
                      style={{ background: 'rgb(var(--admin-cyan-rgb))', color: '#000', border: 'none', fontWeight: '900', padding: '0.85rem', cursor: 'pointer', borderRadius: '6px', marginTop: '0.5rem', width: '100%', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                    >
                      {settingsLoading ? 'SAVING PROFILE...' : <><SaveIcon size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> SAVE PROFILE</>}
                    </button>
                  </form>
                </div>

                {/* Event Preferences Configuration Card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="kbc-panel" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--admin-border)', borderRadius: '12px', padding: '2rem' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: 'rgb(var(--admin-yellow-rgb))', fontSize: '1.25rem', fontWeight: 'bold' }}><KbcControllerIcon size={18} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> Live Arena Timing Preferences</h3>
                    <p className="panel-subtitle" style={{ fontSize: '0.85rem', color: 'var(--admin-muted)', marginBottom: '1.5rem' }}>
                      Configure default timers and round limits saved to global configuration.
                    </p>

                    <form onSubmit={handleSavePreferences} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group" style={{ textAlign: 'left' }}>
                          <label className="admin-form-label" style={{ fontSize: '0.8rem', color: 'var(--admin-muted)' }}>Prelim MCQ Timer (sec)</label>
                          <input 
                            type="number"
                            className="admin-form-input"
                            value={prelimDuration}
                            onChange={(e) => setPrelimDuration(Math.max(10, parseInt(e.target.value) || 0))}
                            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', padding: '0.6rem', borderRadius: '6px', width: '100%' }}
                          />
                        </div>

                        <div className="form-group" style={{ textAlign: 'left' }}>
                          <label className="admin-form-label" style={{ fontSize: '0.8rem', color: 'var(--admin-muted)' }}>FFF Speed Timer (sec)</label>
                          <input 
                            type="number"
                            className="admin-form-input"
                            value={fffDuration}
                            onChange={(e) => setFffDuration(Math.max(5, parseInt(e.target.value) || 0))}
                            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', padding: '0.6rem', borderRadius: '6px', width: '100%' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group" style={{ textAlign: 'left' }}>
                          <label className="admin-form-label" style={{ fontSize: '0.8rem', color: 'var(--admin-muted)' }}>Hotseat Q1-Q5 limit (sec)</label>
                          <input 
                            type="number"
                            className="admin-form-input"
                            value={hotseatQ1Q5Duration}
                            onChange={(e) => setHotseatQ1Q5Duration(Math.max(10, parseInt(e.target.value) || 0))}
                            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', padding: '0.6rem', borderRadius: '6px', width: '100%' }}
                          />
                        </div>

                        <div className="form-group" style={{ textAlign: 'left' }}>
                          <label className="admin-form-label" style={{ fontSize: '0.8rem', color: 'var(--admin-muted)' }}>Hotseat Q6-Q10 limit (sec)</label>
                          <input 
                            type="number"
                            className="admin-form-input"
                            value={hotseatQ6Q10Duration}
                            onChange={(e) => setHotseatQ6Q10Duration(Math.max(10, parseInt(e.target.value) || 0))}
                            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', padding: '0.6rem', borderRadius: '6px', width: '100%' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', cursor: 'pointer' }}>
                        <input 
                          type="checkbox"
                          id="auto-approve-toggle"
                          checked={autoApproveEnrollment}
                          onChange={(e) => setAutoApproveEnrollment(e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="auto-approve-toggle" style={{ fontSize: '0.88rem', color: 'var(--admin-text)', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left' }}>
                          Auto-Approve Manual Registrations (Bypass pending status)
                        </label>
                      </div>

                      <button
                        type="submit"
                        className="dash-chip-btn"
                        style={{ background: 'rgb(var(--admin-yellow-rgb))', color: '#000', border: 'none', fontWeight: '900', padding: '0.85rem', cursor: 'pointer', borderRadius: '6px', marginTop: '1rem', width: '100%', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                      >
                        <SaveIcon size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> SAVE LIVE TOURNAMENT CONFIG
                      </button>
                    </form>
                  </div>

                  {/* Danger Zone System Reset Card */}
                  <div className="kbc-panel" style={{ background: 'rgba(255, 99, 71, 0.04)', border: '1px solid rgba(255, 99, 71, 0.3)', borderRadius: '12px', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ textAlign: 'left' }}>
                      <h3 style={{ margin: '0 0 0.2rem 0', color: '#ff5252', fontSize: '1.1rem', fontWeight: 'bold' }}><AlertIcon size={18} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> DANGER ACTION ZONE</h3>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }}>
                        Perform comprehensive event and cache resets. Actions are irreversible.
                      </p>
                    </div>

                    <button
                      onClick={handleResetLiveEventState}
                      style={{
                        background: 'linear-gradient(135deg, #ff5252 0%, #c62828 100%)',
                        color: '#fff',
                        border: 'none',
                        fontWeight: '900',
                        padding: '0.65rem 1.25rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 10px rgba(255, 82, 82, 0.25)',
                        textTransform: 'uppercase',
                        fontSize: '0.8rem',
                        letterSpacing: '0.05em'
                      }}
                    >
                      Reset KBC States
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </section>

      {/* Root-Level Fullscreen Modal Overlay */}
      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content">
            <button className="admin-modal-close" onClick={() => setShowModal(false)} type="button">&times;</button>
            <h3>{editingQuizId ? 'Edit Quiz' : 'Create New Quiz'}</h3>
            <form onSubmit={handleCreateQuiz} style={{display: 'grid', gap: '1.2rem', gridTemplateColumns: '1fr 1fr'}}>
              <div style={{gridColumn: '1 / -1'}}>
                <label className="admin-form-label">Title</label>
                <input required type="text" className="admin-form-input" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div style={{gridColumn: '1 / -1'}}>
                <label className="admin-form-label">Designated Host</label>
                <select 
                  className="admin-form-input" 
                  value={formData.host || ''} 
                  onChange={e => setFormData({...formData, host: e.target.value})}
                >
                  <option value="">-- Select Host (Default: Yourself) --</option>
                  {adminsList.map(adm => (
                    <option key={adm.id} value={adm.id}>{adm.full_name} ({adm.email})</option>
                  ))}
                </select>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--admin-muted)' }}>
                  Assign an admin to host the KBC live arena event. Defaults to the quiz creator.
                </p>
              </div>
              <div style={{gridColumn: '1 / -1'}}>
                <label className="admin-form-label" style={{ color: 'rgb(var(--admin-yellow-rgb))', fontWeight: 'bold' }}>Tournament Display Title (Intro)</label>
                <input type="text" className="admin-form-input" style={{ borderColor: 'rgba(var(--admin-yellow-rgb), 0.35)', background: 'rgba(0,0,0,0.1)' }} value={formData.intro_title} onChange={e => setFormData({...formData, intro_title: e.target.value})} placeholder="e.g. Kaun Banega Business Tycoon" />
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--admin-muted)', marginBottom: '1rem' }}>
                  Cinematic title shown on contestant/audience entry screens (e.g. "Kaun Banega Business Tycoon"). Splits at "Kaun Banega" automatically!
                </p>
              </div>

              {/* Standard Target Academic Sector Selection */}
              <div style={{gridColumn: '1 / -1', background: 'rgba(255, 255, 255, 0.02)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--admin-border)', marginBottom: '0.5rem'}}>
                <h4 style={{margin: '0 0 1rem 0', color: 'rgb(var(--admin-yellow-rgb))', fontSize: '0.95rem', fontWeight: 'bold'}}>Target Academic Sector</h4>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem'}}>
                  <div>
                    <label className="admin-form-label">Target School *</label>
                    <select 
                      required={!session?.user?.is_super_admin}
                      disabled={!session?.user?.is_super_admin && !!session?.user?.school_id}
                      className="admin-form-input" 
                      style={{ border: '1px solid rgba(212, 175, 55, 0.3)' }}
                      value={formData.eligibility_school} 
                      onChange={(e) => {
                        const schoolId = e.target.value;
                        let suggestedTitle = 'Kaun Banega Crorepati';
                        if (schoolId) {
                          const schoolObj = schools.find(s => String(s.id) === String(schoolId));
                          if (schoolObj) {
                            const name = (schoolObj.school_name || '').toLowerCase();
                            const code = (schoolObj.school_code || '').toLowerCase();
                            if (name.includes('management') || name.includes('business') || name.includes('commerce') || code.includes('som') || code.includes('sob') || name.includes('sobus')) {
                              suggestedTitle = 'Kaun Banega Business Tycoon';
                            } else if (name.includes('pharmacy') || name.includes('medical') || name.includes('health') || name.includes('nursing') || code.includes('sop') || code.includes('somed') || name.includes('sophar')) {
                              suggestedTitle = 'Kaun Banega Pharmacy Expert';
                            } else if (name.includes('law') || name.includes('legal') || code.includes('sol')) {
                              suggestedTitle = 'Kaun Banega Legal Eagle';
                            }
                          }
                        }
                        
                        setFormData({
                          ...formData,
                          eligibility_school: schoolId,
                          eligibility_programs: [],
                          eligibility_branches: [],
                          intro_title: (!formData.intro_title || formData.intro_title === 'Kaun Banega Crorepati') ? suggestedTitle : formData.intro_title
                        });
                      }}
                    >
                      <option value="">{session?.user?.is_super_admin ? '-- All Schools --' : '-- Select Target School --'}</option>
                      {schools.map(school => <option key={school.id} value={school.id}>{school.school_name} ({school.school_code})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="admin-form-label">Target Program *</label>
                    <select 
                      required
                      className="admin-form-input" 
                      style={{ border: '1px solid rgba(212, 175, 55, 0.3)' }}
                      value={formData.eligibility_programs?.[0] || ''} 
                      onChange={e => setFormData({...formData, eligibility_programs: [e.target.value], eligibility_branches: []})} 
                      disabled={!formData.eligibility_school}
                    >
                      <option value="">-- Select Target Program --</option>
                      {programs.map(program => <option key={program.id} value={program.id}>{program.program_name} ({program.program_code})</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                    <label className="admin-form-label">Target Branch(es) *</label>
                    {!formData.eligibility_programs?.[0] ? (
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', fontStyle: 'italic', margin: '0.5rem 0 0 0' }}>
                        Please select a Target Program first to view available branches.
                      </p>
                    ) : (
                      <div 
                        style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
                          gap: '0.8rem', 
                          marginTop: '0.5rem', 
                          maxHeight: '160px', 
                          overflowY: 'auto', 
                          background: 'rgba(0,0,0,0.15)', 
                          border: '1px solid rgba(212, 175, 55, 0.25)', 
                          borderRadius: '8px', 
                          padding: '0.8rem' 
                        }}
                      >
                        {branches.map(branch => {
                          const isSelected = formData.eligibility_branches?.includes(branch.id) || formData.eligibility_branches?.includes(String(branch.id));
                          
                          const handleToggleBranch = () => {
                            let currentList = [...(formData.eligibility_branches || [])];
                            const bId = String(branch.id);
                            const bIdNum = branch.id;
                            
                            const indexStr = currentList.indexOf(bId);
                            const indexNum = currentList.indexOf(bIdNum);
                            
                            if (indexStr > -1) {
                              currentList.splice(indexStr, 1);
                            } else if (indexNum > -1) {
                              currentList.splice(indexNum, 1);
                            } else {
                              currentList.push(bIdNum);
                            }
                            
                            setFormData({
                              ...formData,
                              eligibility_branches: currentList
                            });
                          };

                          return (
                            <label 
                              key={branch.id} 
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.6rem', 
                                background: isSelected ? 'rgba(212, 175, 55, 0.08)' : 'rgba(255,255,255,0.02)', 
                                border: isSelected ? '1px solid var(--admin-yellow)' : '1px solid rgba(255,255,255,0.06)', 
                                padding: '0.5rem 0.8rem', 
                                borderRadius: '6px', 
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                userSelect: 'none'
                              }}
                            >
                              <input 
                                type="checkbox"
                                checked={isSelected}
                                onChange={handleToggleBranch}
                                style={{ 
                                  accentColor: 'var(--admin-yellow)',
                                  width: '16px',
                                  height: '16px',
                                  cursor: 'pointer'
                                }}
                              />
                              <span style={{ fontSize: '0.88rem', color: isSelected ? '#fff' : 'rgba(255,255,255,0.7)', fontWeight: isSelected ? 'bold' : 'normal' }}>
                                {branch.branch_name} ({branch.branch_code})
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div style={{gridColumn: '1 / -1'}}>
                <label className="admin-form-label">Description</label>
                <textarea className="admin-form-input admin-form-textarea" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div style={{gridColumn: '1 / -1'}}>
                <label className="admin-form-label">Rules & Instructions</label>
                <textarea className="admin-form-input admin-form-textarea" value={formData.rules_instructions} onChange={e => setFormData({...formData, rules_instructions: e.target.value})} />
              </div>
              
              <div>
                <label className="admin-form-label">Event Date & Time</label>
                <div style={{display: 'flex', gap: '0.5rem'}}>
                  <input type="date" className="admin-form-input" value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})} />
                  <input type="time" className="admin-form-input" value={formData.event_time} onChange={e => setFormData({...formData, event_time: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="admin-form-label">Max Participants</label>
                <input type="number" min="0" className="admin-form-input" value={formData.max_participants} onChange={e => setFormData({...formData, max_participants: e.target.value})} />
              </div>
              
              <div>
                <label className="admin-form-label">Registration Open Time</label>
                <div style={{display: 'flex', gap: '0.5rem'}}>
                  <input type="date" className="admin-form-input" value={formData.registration_open_date} onChange={e => setFormData({...formData, registration_open_date: e.target.value})} />
                  <input type="time" className="admin-form-input" value={formData.registration_open_time} onChange={e => setFormData({...formData, registration_open_time: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="admin-form-label">Registration Fee (₹)</label>
                <input type="number" step="0.01" min="0" className="admin-form-input" value={formData.registration_fee} onChange={e => setFormData({...formData, registration_fee: e.target.value})} />
              </div>

              <div style={{gridColumn: '1 / -1'}}>
                <label className="admin-form-label">Registration Close Time (Optional)</label>
                <div style={{display: 'flex', gap: '0.5rem'}}>
                  <input type="date" className="admin-form-input" value={formData.registration_close_date} onChange={e => setFormData({...formData, registration_close_date: e.target.value})} />
                  <input type="time" className="admin-form-input" value={formData.registration_close_time} onChange={e => setFormData({...formData, registration_close_time: e.target.value})} />
                </div>
              </div>

              {/* Toggles */}
              <div style={{display: 'flex', gap: '1.5rem', alignItems: 'center', gridColumn: '1 / -1', marginTop: '0.5rem', flexWrap: 'wrap'}}>
                <label className="admin-checkbox-label">
                  <input type="checkbox" checked={formData.visible_to_students} onChange={e => setFormData({...formData, visible_to_students: e.target.checked})} style={{width: '18px', height: '18px'}} />
                  Visible to Students
                </label>
                <label className="admin-checkbox-label">
                  <input type="checkbox" checked={formData.is_registration_open} onChange={e => setFormData({...formData, is_registration_open: e.target.checked})} style={{width: '18px', height: '18px'}} />
                  Registration Open
                </label>
              </div>
              
              <div style={{gridColumn: '1 / -1', marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--admin-border)', paddingTop: '1.5rem'}}>
                {editingQuizId ? (
                  <button 
                    type="button" 
                    className="admin-btn-cancel" 
                    onClick={() => {
                      handleDeleteClick(editingQuizId);
                      setShowModal(false);
                    }}
                    style={{
                      background: 'rgba(255, 80, 80, 0.12)',
                      borderColor: 'rgba(255, 80, 80, 0.4)',
                      color: 'rgb(255, 120, 120)',
                      marginRight: 'auto'
                    }}
                  >
                    DELETE QUIZ
                  </button>
                ) : <div />}

                <div style={{display: 'flex', gap: '1rem'}}>
                  <button type="button" className="admin-btn-cancel" onClick={() => setShowModal(false)}>
                    CANCEL
                  </button>
                  <button type="button" className="admin-btn-draft" onClick={handleSaveDraft} disabled={submitLoading}>
                    SAVE AS DRAFT
                  </button>
                  <button className="dash-chip-btn" type="submit" disabled={submitLoading} style={{background: 'rgb(var(--admin-cyan-rgb))', color: '#000', border: 'none', fontWeight: 'bold', padding: '0.8rem 2rem', fontSize: '1rem', cursor: 'pointer', borderRadius: '4px'}}>
                    {submitLoading ? 'SAVING...' : (editingQuizId ? 'SAVE CHANGES' : 'CREATE QUIZ')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {uploadResult && (
        <div className="admin-modal-overlay" style={{ zIndex: 1050 }}>
          <div className="admin-modal-content" style={{ maxWidth: '650px', padding: '2.5rem' }}>
            <button className="admin-modal-close" onClick={() => setUploadResult(null)} type="button">&times;</button>
            <h3 style={{ color: 'var(--admin-text)', marginBottom: '1.5rem' }}>📊 Question Excel Upload Report</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(56, 176, 0, 0.08)', border: '1px solid rgba(56, 176, 0, 0.3)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--admin-muted)', fontWeight: 'bold' }}>SUCCESSFULLY ADDED</span>
                <h2 style={{ color: '#38b000', margin: '0.5rem 0 0 0', fontSize: '2.25rem' }}>{uploadResult.success_count}</h2>
              </div>
              <div style={{ background: 'rgba(217, 4, 41, 0.08)', border: '1px solid rgba(217, 4, 41, 0.3)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--admin-muted)', fontWeight: 'bold' }}>SKIPPED WITH ERRORS</span>
                <h2 style={{ color: '#d90429', margin: '0.5rem 0 0 0', fontSize: '2.25rem' }}>{uploadResult.error_count}</h2>
              </div>
            </div>
            
            {uploadResult.error_count > 0 && (
              <>
                <h4 style={{ color: 'rgb(255, 120, 120)', marginBottom: '0.5rem', fontFamily: 'monospace' }}>⚠️ Validation Warnings & Errors</h4>
                <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--admin-border)', borderRadius: '6px', background: 'var(--admin-bg-deep)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--admin-surface)', borderBottom: '1px solid var(--admin-border)' }}>
                        <th style={{ padding: '0.6rem', textAlign: 'center', width: '60px' }}>Row</th>
                        <th style={{ padding: '0.6rem', textAlign: 'left' }}>Question Text</th>
                        <th style={{ padding: '0.6rem', textAlign: 'left' }}>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadResult.errors.map((err, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '0.6rem', textAlign: 'center', color: 'var(--admin-muted)', fontWeight: 'bold' }}>{err.row}</td>
                          <td style={{ padding: '0.6rem', color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }} title={err.question}>{err.question}</td>
                          <td style={{ padding: '0.6rem', color: '#ffb703', fontWeight: '500' }}>{err.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="dash-chip-btn" 
                onClick={() => setUploadResult(null)}
                style={{ padding: '0.6rem 2.5rem', background: 'rgb(var(--admin-cyan-rgb))', color: '#000', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
              >
                DISMISS
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedManageQuiz && (
        <div className="admin-modal-overlay" style={{ zIndex: 1000 }}>
          <div className="admin-modal-content" style={{ maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem' }}>
            <button className="admin-modal-close" onClick={() => setSelectedManageQuiz(null)} type="button">&times;</button>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span className="admin-welcome-kicker">Manage Quiz Event Sector</span>
                <h3 style={{ margin: 0, fontSize: '1.75rem', color: 'var(--admin-text)' }}>{selectedManageQuiz.title}</h3>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  type="button" 
                  className="dash-chip-btn" 
                  onClick={() => handleManageSwitchCategoriesClick(selectedManageQuiz)}
                  style={{
                    background: 'rgb(var(--admin-pink-rgb))',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 'bold'
                  }}
                >
                  🔄 Configure Switch Categories
                </button>
                <button 
                  type="button" 
                  className="dash-chip-btn" 
                  onClick={() => setShowAddQuestionForm(!showAddQuestionForm)}
                  style={{
                    background: showAddQuestionForm ? 'rgba(255,255,255,0.08)' : 'rgb(var(--admin-cyan-rgb))',
                    color: showAddQuestionForm ? 'var(--admin-text)' : '#000',
                    border: showAddQuestionForm ? '1px solid var(--admin-border)' : 'none',
                    fontWeight: 'bold'
                  }}
                >
                  {showAddQuestionForm ? 'Close Manual Creator' : '+ Add Question Manually'}
                </button>
              </div>
            </div>

            {/* Manual Question Creator Form */}
            {showAddQuestionForm && (
              <form onSubmit={handleAddQuestionSubmit} style={{ background: 'var(--admin-bg-deep)', border: '1px solid var(--admin-border)', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', display: 'grid', gap: '1.2rem', gridTemplateColumns: '1fr 1fr' }}>
                <h4 style={{ gridColumn: '1 / -1', margin: 0, color: 'rgb(var(--admin-cyan-rgb))' }}>📝 Add Question Manually</h4>
                
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="admin-form-label">Question Text</label>
                  <textarea 
                    required 
                    rows={2} 
                    className="admin-form-input admin-form-textarea" 
                    value={newQuestionData.text} 
                    onChange={e => setNewQuestionData({ ...newQuestionData, text: e.target.value })} 
                  />
                </div>
                
                <div>
                  <label className="admin-form-label">Question Type</label>
                  <select 
                    className="admin-form-input" 
                    value={newQuestionData.question_type} 
                    onChange={e => setNewQuestionData({ ...newQuestionData, question_type: e.target.value })}
                  >
                    <option value="regular">Regular (Preliminary)</option>
                    <option value="fff_1">Fastest Finger First (Batch 1)</option>
                    <option value="fff_2">Fastest Finger First (Batch 2)</option>
                    <option value="fff_3">Fastest Finger First (Batch 3)</option>
                    <option value="hotseat_1">Hotseat (Batch 1)</option>
                    <option value="hotseat_2">Hotseat (Batch 2)</option>
                    <option value="hotseat_3">Hotseat (Batch 3)</option>
                  </select>
                </div>
                <div>
                  <label className="admin-form-label">Category</label>
                  <input 
                    type="text" 
                    className="admin-form-input" 
                    value={newQuestionData.category} 
                    onChange={e => setNewQuestionData({ ...newQuestionData, category: e.target.value })} 
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="admin-form-label">Trivia / Explanation</label>
                  <textarea 
                    rows={2} 
                    className="admin-form-input admin-form-textarea" 
                    value={newQuestionData.trivia} 
                    onChange={e => setNewQuestionData({ ...newQuestionData, trivia: e.target.value })} 
                  />
                </div>

                {/* Choices Row */}
                <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                  <h5 style={{ gridColumn: '1 / -1', margin: 0, color: 'var(--admin-text)' }}>Options & Correct Answer</h5>
                  {newQuestionData.choices.map((choice, index) => {
                    const isFFF = newQuestionData.question_type.startsWith('fff_');
                    return (
                      <div key={index} style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', padding: '0.8rem', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--admin-muted)' }}>Option {String.fromCharCode(65 + index)}</span>
                        <input 
                          required 
                          type="text" 
                          placeholder="Option Text" 
                          className="admin-form-input" 
                          value={choice.text} 
                          onChange={e => {
                            const updatedChoices = [...newQuestionData.choices];
                            updatedChoices[index].text = e.target.value;
                            setNewQuestionData({ ...newQuestionData, choices: updatedChoices });
                          }} 
                        />
                        
                        {!isFFF ? (
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--admin-text)', cursor: 'pointer' }}>
                            <input 
                              type="radio" 
                              name="manual-correct-choice" 
                              checked={choice.is_correct} 
                              onChange={() => {
                                const updatedChoices = newQuestionData.choices.map((c, i) => ({
                                  ...c,
                                  is_correct: i === index
                                }));
                                setNewQuestionData({ ...newQuestionData, choices: updatedChoices });
                              }} 
                            />
                            Is Correct Option
                          </label>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--admin-text)' }}>Sequence Rank:</span>
                            <select 
                              className="admin-form-input" 
                              style={{ padding: '0.2rem 0.5rem', minWidth: '60px' }}
                              value={choice.correct_order || 1} 
                              onChange={e => {
                                const updatedChoices = [...newQuestionData.choices];
                                updatedChoices[index].correct_order = parseInt(e.target.value);
                                updatedChoices[index].is_correct = false;
                                setNewQuestionData({ ...newQuestionData, choices: updatedChoices });
                              }}
                            >
                              {newQuestionData.choices.map((_, i) => (
                                <option key={i + 1} value={i + 1}>{i + 1}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {newQuestionData.question_type.startsWith('fff_') && (
                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                      {newQuestionData.choices.length < 15 && (
                        <button
                          type="button"
                          className="dash-chip-btn"
                          onClick={() => setNewQuestionData(prev => ({
                            ...prev,
                            choices: [...prev.choices, { text: '', is_correct: false, correct_order: prev.choices.length + 1 }]
                          }))}
                          style={{ borderColor: 'rgb(var(--admin-cyan-rgb))', color: 'rgb(var(--admin-cyan-rgb))' }}
                        >
                          + Add FFF Option ({newQuestionData.choices.length}/15)
                        </button>
                      )}
                      {newQuestionData.choices.length > 8 && (
                        <button
                          type="button"
                          className="dash-chip-btn"
                          onClick={() => setNewQuestionData(prev => ({
                            ...prev,
                            choices: prev.choices.slice(0, -1)
                          }))}
                          style={{ borderColor: 'rgb(255, 80, 80)', color: 'rgb(255, 80, 80)' }}
                        >
                          - Remove Last Option
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button 
                    type="button" 
                    className="admin-btn-cancel" 
                    onClick={() => setShowAddQuestionForm(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="dash-chip-btn" 
                    style={{ background: 'rgb(var(--admin-cyan-rgb))', color: '#000', border: 'none', fontWeight: 'bold' }}
                  >
                    Save Question
                  </button>
                </div>
              </form>
            )}

            {/* Search and Filters Panel */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', background: 'var(--admin-bg-deep)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--admin-border)', marginBottom: '1.5rem' }}>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  className="admin-form-input" 
                  placeholder="🔍 Search questions by text..." 
                  value={questionSearchQuery} 
                  onChange={e => setQuestionSearchQuery(e.target.value)} 
                  style={{ paddingLeft: '2.5rem', margin: 0 }}
                />
              </div>
              <div>
                <select 
                  className="admin-form-input" 
                  value={questionTypeFilter} 
                  onChange={e => setQuestionTypeFilter(e.target.value)}
                  style={{ 
                    margin: 0,
                    background: '#0c1122',
                    color: '#ffffff',
                    border: '1px solid var(--admin-border)'
                  }}
                >
                  <option value="all" style={{ background: '#0c1122', color: '#ffffff' }}>🌐 All Rounds</option>
                  <option value="regular" style={{ background: '#0c1122', color: '#ffffff' }}>📝 Prelim Round (MCQ)</option>
                  <option value="fff" style={{ background: '#0c1122', color: '#ffffff' }}>⚡ Fastest Finger First (FFF)</option>
                  <option value="hotseat_1" style={{ background: '#0c1122', color: '#ffffff' }}>👑 Hotseat Round 1</option>
                  <option value="hotseat_2" style={{ background: '#0c1122', color: '#ffffff' }}>👑 Hotseat Round 2</option>
                  <option value="hotseat_3" style={{ background: '#0c1122', color: '#ffffff' }}>👑 Hotseat Round 3</option>
                  <option value="switch" style={{ background: '#0c1122', color: '#ffffff' }}>🔄 Switch Question</option>
                </select>
              </div>
            </div>

            {/* Questions List */}
            <h4 style={{ color: 'var(--admin-text)', borderBottom: '1px solid var(--admin-border)', paddingBottom: '0.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📋 Loaded Questions ({manageQuestions.length})</span>
              {manageQuestions.length > 0 && <span style={{ fontSize: '0.85rem', color: 'var(--admin-muted)', fontWeight: 'normal' }}>Filtered: {
                (() => {
                  const filteredQuestions = manageQuestions.filter(q => {
                    const matchesSearch = q.text.toLowerCase().includes(questionSearchQuery.toLowerCase());
                    let matchesType = true;
                    if (questionTypeFilter !== 'all') {
                      if (questionTypeFilter === 'fff') {
                        matchesType = q.question_type.startsWith('fff');
                      } else {
                        matchesType = q.question_type === questionTypeFilter;
                      }
                    }
                    return matchesSearch && matchesType;
                  });
                  return filteredQuestions.length;
                })()
              }</span>}
            </h4>

            {manageQuestions.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--admin-muted)', padding: '2rem', fontStyle: 'italic' }}>
                No questions exist inside this quiz event yet.<br/>
                Add questions manually or upload an Excel sheet to seed them.
              </p>
            ) : (() => {
              const filteredQuestions = manageQuestions.filter(q => {
                const matchesSearch = q.text.toLowerCase().includes(questionSearchQuery.toLowerCase());
                let matchesType = true;
                if (questionTypeFilter !== 'all') {
                  if (questionTypeFilter === 'fff') {
                    matchesType = q.question_type.startsWith('fff');
                  } else {
                    matchesType = q.question_type === questionTypeFilter;
                  }
                }
                return matchesSearch && matchesType;
              });

              if (filteredQuestions.length === 0) {
                return (
                  <p style={{ textAlign: 'center', color: 'var(--admin-muted)', padding: '3rem', fontStyle: 'italic' }}>
                    🔍 No questions found matching your search or round filter criteria.
                  </p>
                );
              }

              const roundsList = [
                { key: 'regular', title: '📝 PRELIM ROUND (MCQ)', color: 'rgb(var(--admin-cyan-rgb))', bg: 'rgba(var(--admin-cyan-rgb), 0.03)' },
                { key: 'fff', title: '⚡ FASTEST FINGER FIRST (FFF)', color: '#ffd700', bg: 'rgba(255, 215, 0, 0.03)' },
                { key: 'hotseat_1', title: '👑 HOTSEAT ROUND 1', color: '#db2777', bg: 'rgba(219, 39, 119, 0.03)' },
                { key: 'hotseat_2', title: '👑 HOTSEAT ROUND 2', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.03)' },
                { key: 'hotseat_3', title: '👑 HOTSEAT ROUND 3', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.03)' },
                { key: 'switch', title: '🔄 SWITCH LIFELINE QUESTIONS', color: '#f472b6', bg: 'rgba(244, 114, 182, 0.03)' }
              ];

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {roundsList.map(round => {
                    const roundQuestions = filteredQuestions.filter(q => {
                      if (round.key === 'fff') return q.question_type.startsWith('fff');
                      return q.question_type === round.key;
                    });

                    if (roundQuestions.length === 0) return null;

                    return (
                      <div 
                        key={round.key} 
                        style={{ 
                          border: `2px solid ${round.color}40`, 
                          borderRadius: '12px', 
                          padding: '1.5rem', 
                          background: round.bg, 
                          boxShadow: `0 4px 20px ${round.color}0d` 
                        }}
                      >
                        {/* Section Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: `1px solid ${round.color}25`, paddingBottom: '0.6rem' }}>
                          <h3 style={{ margin: 0, color: round.color, fontSize: '1.15rem', fontWeight: '900', letterSpacing: '0.05em' }}>
                            {round.title}
                          </h3>
                          <span style={{ background: round.color, color: '#000', fontWeight: 'bold', fontSize: '0.78rem', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>
                            {roundQuestions.length} {roundQuestions.length === 1 ? 'Question' : 'Questions'}
                          </span>
                        </div>

                        {/* Questions Cards Grid under this Round */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {roundQuestions.map((q, idx) => (
                            <div key={q.id} className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--admin-border)', background: 'var(--admin-surface)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '0.8rem' }}>
                                <div style={{ flex: 1, textAlign: 'left' }}>
                                  <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', color: 'var(--admin-muted)', padding: '0.2rem 0.5rem', border: '1px solid var(--admin-border)', borderRadius: '4px', textTransform: 'uppercase', display: 'inline-block', marginBottom: '0.5rem', fontFamily: 'monospace' }}>
                                    Order: {q.order} • Category: {q.category || 'General'}
                                  </span>
                                  <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--admin-text)' }}>
                                    Q{idx + 1}. {q.text}
                                  </h4>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                  <button 
                                    type="button" 
                                    className="dash-chip-btn" 
                                    onClick={() => handleEditQuestionClick(q)}
                                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.7rem' }}
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    type="button" 
                                    className="dash-chip-btn" 
                                    onClick={() => handleDeleteQuestion(q.id)}
                                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.7rem', color: '#ff5050', borderColor: 'rgba(255,80,80,0.3)' }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>

                              {/* Choices render */}
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
                                {q.choices.map((c, cIndex) => {
                                  const correctHighlight = c.is_correct;
                                  const correctSeq = c.correct_order;
                                  return (
                                    <div 
                                      key={c.id} 
                                      style={{
                                        padding: '0.5rem 0.8rem',
                                        borderRadius: '4px',
                                        background: correctHighlight ? 'rgba(56, 176, 0, 0.08)' : (correctSeq ? 'rgba(212, 175, 55, 0.08)' : 'var(--admin-bg-deep)'),
                                        border: correctHighlight ? '1px solid rgba(56, 176, 0, 0.3)' : (correctSeq ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid var(--admin-border)'),
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                      }}
                                    >
                                      <span style={{ color: correctHighlight ? '#38b000' : (correctSeq ? '#d4af37' : 'rgba(255,255,255,0.85)') }}>
                                        <strong>{['A', 'B', 'C', 'D'][cIndex] || cIndex + 1}.</strong> {c.text}
                                      </span>
                                      {correctHighlight && <span style={{ color: '#38b000', fontSize: '0.75rem', fontWeight: 'bold' }}>✓ CORRECT</span>}
                                      {correctSeq && <span style={{ color: '#d4af37', fontSize: '0.75rem', fontWeight: 'bold' }}>RANK {correctSeq}</span>}
                                    </div>
                                  );
                                })}
                              </div>

                              {q.trivia && (
                                <p style={{ margin: '0.8rem 0 0 0', fontSize: '0.85rem', color: 'var(--admin-muted)', fontStyle: 'italic', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '4px', borderLeft: '3px solid var(--admin-border)', textAlign: 'left' }}>
                                  ℹ️ <strong>Explanation:</strong> {q.trivia}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            
            <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--admin-border)', paddingTop: '1.5rem' }}>
              <button 
                type="button" 
                className="admin-btn-cancel" 
                onClick={() => setSelectedManageQuiz(null)}
                style={{ padding: '0.6rem 3rem' }}
              >
                DISMISS CONSOLE
              </button>
            </div>
          </div>
        </div>
      )}

      {editingQuestion && (
        <div className="admin-modal-overlay" style={{ zIndex: 1100 }}>
          <div className="admin-modal-content" style={{ maxWidth: '650px', padding: '2.5rem' }}>
            <button className="admin-modal-close" onClick={() => setEditingQuestion(null)} type="button">&times;</button>
            <h3 style={{ color: 'var(--admin-text)', marginBottom: '1.5rem' }}>📝 Edit Question</h3>
            
            <form onSubmit={handleEditQuestionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label className="admin-form-label">Question Text</label>
                <textarea 
                  required 
                  rows={2} 
                  className="admin-form-input admin-form-textarea" 
                  value={newQuestionData.text} 
                  onChange={e => setNewQuestionData({ ...newQuestionData, text: e.target.value })} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="admin-form-label">Question Type</label>
                  <select 
                    className="admin-form-input" 
                    value={newQuestionData.question_type} 
                    onChange={e => setNewQuestionData({ ...newQuestionData, question_type: e.target.value })}
                  >
                    <option value="regular">Regular (Preliminary)</option>
                    <option value="fff_1">Fastest Finger First (Batch 1)</option>
                    <option value="fff_2">Fastest Finger First (Batch 2)</option>
                    <option value="fff_3">Fastest Finger First (Batch 3)</option>
                    <option value="hotseat_1">Hotseat (Batch 1)</option>
                    <option value="hotseat_2">Hotseat (Batch 2)</option>
                    <option value="hotseat_3">Hotseat (Batch 3)</option>
                  </select>
                </div>
                <div>
                  <label className="admin-form-label">Category</label>
                  <input 
                    type="text" 
                    className="admin-form-input" 
                    value={newQuestionData.category} 
                    onChange={e => setNewQuestionData({ ...newQuestionData, category: e.target.value })} 
                  />
                </div>
              </div>

              <div>
                <label className="admin-form-label">Trivia / Explanation</label>
                <textarea 
                  rows={2} 
                  className="admin-form-input admin-form-textarea" 
                  value={newQuestionData.trivia} 
                  onChange={e => setNewQuestionData({ ...newQuestionData, trivia: e.target.value })} 
                />
              </div>

              {/* Choices Rendering */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <h5 style={{ gridColumn: '1 / -1', margin: '0.5rem 0 0 0', color: 'var(--admin-text)' }}>Options & Correct Answer</h5>
                {newQuestionData.choices.map((choice, index) => {
                  const isFFF = newQuestionData.question_type.startsWith('fff_');
                  return (
                    <div key={index} style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', padding: '0.8rem', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--admin-muted)' }}>Option {String.fromCharCode(65 + index)}</span>
                      <input 
                        required 
                        type="text" 
                        placeholder="Option Text" 
                        className="admin-form-input" 
                        value={choice.text} 
                        onChange={e => {
                          const updatedChoices = [...newQuestionData.choices];
                          updatedChoices[index].text = e.target.value;
                          setNewQuestionData({ ...newQuestionData, choices: updatedChoices });
                        }} 
                      />
                      
                      {!isFFF ? (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--admin-text)', cursor: 'pointer' }}>
                          <input 
                            type="radio" 
                            name="edit-correct-choice" 
                            checked={choice.is_correct} 
                            onChange={() => {
                              const updatedChoices = newQuestionData.choices.map((c, i) => ({
                                ...c,
                                is_correct: i === index
                              }));
                              setNewQuestionData({ ...newQuestionData, choices: updatedChoices });
                            }} 
                          />
                          Is Correct Option
                        </label>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--admin-text)' }}>Sequence Rank:</span>
                          <select 
                            className="admin-form-input" 
                            style={{ padding: '0.2rem 0.5rem', minWidth: '60px' }}
                            value={choice.correct_order || 1} 
                            onChange={e => {
                              const updatedChoices = [...newQuestionData.choices];
                              updatedChoices[index].correct_order = parseInt(e.target.value);
                              updatedChoices[index].is_correct = false;
                              setNewQuestionData({ ...newQuestionData, choices: updatedChoices });
                            }}
                          >
                            {newQuestionData.choices.map((_, i) => (
                              <option key={i + 1} value={i + 1}>{i + 1}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {newQuestionData.question_type.startsWith('fff_') && (
                  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    {newQuestionData.choices.length < 15 && (
                      <button
                        type="button"
                        className="dash-chip-btn"
                        onClick={() => setNewQuestionData(prev => ({
                          ...prev,
                          choices: [...prev.choices, { text: '', is_correct: false, correct_order: prev.choices.length + 1 }]
                        }))}
                        style={{ borderColor: 'rgb(var(--admin-cyan-rgb))', color: 'rgb(var(--admin-cyan-rgb))' }}
                      >
                        + Add FFF Option ({newQuestionData.choices.length}/15)
                      </button>
                    )}
                    {newQuestionData.choices.length > 8 && (
                      <button
                        type="button"
                        className="dash-chip-btn"
                        onClick={() => setNewQuestionData(prev => ({
                          ...prev,
                          choices: prev.choices.slice(0, -1)
                        }))}
                        style={{ borderColor: 'rgb(255, 80, 80)', color: 'rgb(255, 80, 80)' }}
                      >
                        - Remove Last Option
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid var(--admin-border)', paddingTop: '1.5rem' }}>
                <button 
                  type="button" 
                  className="admin-btn-cancel" 
                  onClick={() => setEditingQuestion(null)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="dash-chip-btn" 
                  style={{ background: 'rgb(var(--admin-cyan-rgb))', color: '#000', border: 'none', fontWeight: 'bold', padding: '0.6rem 2rem' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSwitchCategoryPanel && selectedManageQuiz && (
        <div className="admin-modal-overlay" style={{ zIndex: 1050 }}>
          <div className="admin-modal-content" style={{ maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem' }}>
            <button className="admin-modal-close" onClick={() => setShowSwitchCategoryPanel(false)} type="button">&times;</button>
            
            <span className="admin-welcome-kicker">Switch Lifeline Domain Editor</span>
            <h3 style={{ margin: 0, fontSize: '1.75rem', color: 'var(--admin-text)', marginBottom: '1.5rem' }}>
              Configure Switch Categories for {selectedManageQuiz.title} ({adminSwitchCategories.length}/6)
            </h3>
            
            <form onSubmit={handleSaveSwitchCategorySubmit} style={{ background: 'var(--admin-bg-deep)', border: '1px solid var(--admin-border)', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', display: 'grid', gap: '1.2rem', gridTemplateColumns: '1fr 1fr' }}>
              <h4 style={{ gridColumn: '1 / -1', margin: 0, color: 'rgb(var(--admin-cyan-rgb))' }}>
                {editingSwitchCategory ? '📝 Edit Switch Category & Question' : '➕ Add Switch Category & Question'}
              </h4>
              
              <div>
                <label className="admin-form-label">Category Name</label>
                <input 
                  required 
                  type="text" 
                  className="admin-form-input" 
                  placeholder="e.g. Sports, Science, Bollywood" 
                  value={switchCategoryForm.name} 
                  onChange={e => setSwitchCategoryForm({ ...switchCategoryForm, name: e.target.value })} 
                />
              </div>
              
              <div>
                <label className="admin-form-label">Category Cover Image</label>
                <input 
                  type="file" 
                  accept="image/*"
                  className="admin-form-input" 
                  onChange={e => setSwitchCategoryForm({ ...switchCategoryForm, image: e.target.files[0] })} 
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label className="admin-form-label">Question Text</label>
                <textarea 
                  required 
                  rows={2} 
                  className="admin-form-input admin-form-textarea" 
                  value={switchCategoryForm.question_text} 
                  onChange={e => setSwitchCategoryForm({ ...switchCategoryForm, question_text: e.target.value })} 
                />
              </div>
              
              <div>
                <label className="admin-form-label">Option A</label>
                <input 
                  required 
                  type="text" 
                  className="admin-form-input" 
                  value={switchCategoryForm.choice_a} 
                  onChange={e => setSwitchCategoryForm({ ...switchCategoryForm, choice_a: e.target.value })} 
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--admin-text)', cursor: 'pointer', marginTop: '0.4rem' }}>
                  <input 
                    type="radio" 
                    name="switch-correct-choice" 
                    checked={switchCategoryForm.correct_choice === 'A'} 
                    onChange={() => setSwitchCategoryForm({ ...switchCategoryForm, correct_choice: 'A' })} 
                  />
                  Is Option A Correct
                </label>
              </div>
              
              <div>
                <label className="admin-form-label">Option B</label>
                <input 
                  required 
                  type="text" 
                  className="admin-form-input" 
                  value={switchCategoryForm.choice_b} 
                  onChange={e => setSwitchCategoryForm({ ...switchCategoryForm, choice_b: e.target.value })} 
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--admin-text)', cursor: 'pointer', marginTop: '0.4rem' }}>
                  <input 
                    type="radio" 
                    name="switch-correct-choice" 
                    checked={switchCategoryForm.correct_choice === 'B'} 
                    onChange={() => setSwitchCategoryForm({ ...switchCategoryForm, correct_choice: 'B' })} 
                  />
                  Is Option B Correct
                </label>
              </div>
              
              <div>
                <label className="admin-form-label">Option C</label>
                <input 
                  required 
                  type="text" 
                  className="admin-form-input" 
                  value={switchCategoryForm.choice_c} 
                  onChange={e => setSwitchCategoryForm({ ...switchCategoryForm, choice_c: e.target.value })} 
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--admin-text)', cursor: 'pointer', marginTop: '0.4rem' }}>
                  <input 
                    type="radio" 
                    name="switch-correct-choice" 
                    checked={switchCategoryForm.correct_choice === 'C'} 
                    onChange={() => setSwitchCategoryForm({ ...switchCategoryForm, correct_choice: 'C' })} 
                  />
                  Is Option C Correct
                </label>
              </div>
              
              <div>
                <label className="admin-form-label">Option D</label>
                <input 
                  required 
                  type="text" 
                  className="admin-form-input" 
                  value={switchCategoryForm.choice_d} 
                  onChange={e => setSwitchCategoryForm({ ...switchCategoryForm, choice_d: e.target.value })} 
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--admin-text)', cursor: 'pointer', marginTop: '0.4rem' }}>
                  <input 
                    type="radio" 
                    name="switch-correct-choice" 
                    checked={switchCategoryForm.correct_choice === 'D'} 
                    onChange={() => setSwitchCategoryForm({ ...switchCategoryForm, correct_choice: 'D' })} 
                  />
                  Is Option D Correct
                </label>
              </div>
              
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                {editingSwitchCategory && (
                  <button 
                    type="button" 
                    className="admin-btn-cancel" 
                    onClick={() => {
                      setEditingSwitchCategory(null);
                      setSwitchCategoryForm({
                        name: '',
                        question_text: '',
                        choice_a: '',
                        choice_b: '',
                        choice_c: '',
                        choice_d: '',
                        correct_choice: 'A',
                        image: null
                      });
                    }}
                  >
                    Cancel Edit
                  </button>
                )}
                <button 
                  type="submit" 
                  className="dash-chip-btn" 
                  disabled={savingCategory}
                  style={{ background: 'rgb(var(--admin-cyan-rgb))', color: '#000', border: 'none', fontWeight: 'bold' }}
                >
                  {savingCategory ? 'SAVING...' : (editingSwitchCategory ? 'Save Changes' : 'Create Category')}
                </button>
              </div>
            </form>
            
            <h4 style={{ color: 'var(--admin-text)', borderBottom: '1px solid var(--admin-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              📋 Active Switch Categories ({adminSwitchCategories.length}/6)
            </h4>
            
            {loadingSwitchCategories ? (
              <p style={{ color: 'var(--admin-muted)', textAlign: 'center', padding: '2rem' }}>Loading Switch Categories...</p>
            ) : adminSwitchCategories.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--admin-muted)', padding: '2rem', fontStyle: 'italic' }}>
                No switch lifeline categories configured yet. Add them above to configure the Switch Question lifeline!
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                {adminSwitchCategories.map((cat) => (
                  <div key={cat.id} className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--admin-border)', background: 'var(--admin-surface)' }}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ width: '80px', height: '60px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {cat.image ? (
                          <img src={cat.image} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '1.5rem' }}>📚</span>
                        )}
                      </div>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <span style={{ display: 'block', fontSize: '0.7rem', color: '#d4af37', textTransform: 'uppercase', fontWeight: 'bold' }}>SWITCH CATEGORY</span>
                        <h4 style={{ margin: 0, color: 'var(--admin-text)', fontSize: '1.15rem' }}>{cat.name}</h4>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', alignSelf: 'flex-start' }}>
                        <button 
                          type="button"
                          className="dash-chip-btn" 
                          onClick={() => {
                            try {
                              console.log("Edit button clicked for switch category:", cat);
                              setEditingSwitchCategory(cat);
                              const q = cat.question || {};
                              const choices = q.choices || [];
                              console.log("Question associated with category:", q);
                              console.log("Choices list:", choices);
                              
                              const correctIdx = choices.findIndex(c => c.is_correct);
                              const correctLetter = ['A', 'B', 'C', 'D'][correctIdx] || 'A';
                              console.log("Correct choice index:", correctIdx, "Letter:", correctLetter);
                              
                              setSwitchCategoryForm({
                                name: cat.name || '',
                                question_text: q.text || '',
                                choice_a: choices[0]?.text || '',
                                choice_b: choices[1]?.text || '',
                                choice_c: choices[2]?.text || '',
                                choice_d: choices[3]?.text || '',
                                correct_choice: correctLetter,
                                image: null
                              });
                              console.log("Switch category form successfully populated.");
                            } catch (err) {
                              console.error("Error populating switch category edit form:", err);
                              alert("Failed to load category details: " + err.message);
                            }
                          }}
                          style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
                        >
                          Edit
                        </button>
                        <button 
                          type="button"
                          className="dash-chip-btn" 
                          onClick={() => handleDeleteSwitchCategory(cat.id)}
                          style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', color: '#ff5050', borderColor: 'rgba(255,80,80,0.3)' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    {cat.question ? (
                      <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)', background: 'var(--admin-bg-deep)', padding: '0.8rem', borderRadius: '6px', textAlign: 'left' }}>
                        <strong style={{ color: 'rgb(var(--admin-cyan-rgb))', display: 'block', marginBottom: '0.3rem' }}>Question:</strong>
                        {cat.question.text}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.6rem' }}>
                          {cat.question.choices.map((choice, i) => (
                            <div key={choice.id} style={{ fontSize: '0.8rem', color: choice.is_correct ? '#38b000' : 'rgba(255,255,255,0.6)', fontWeight: choice.is_correct ? 'bold' : 'normal' }}>
                              {['A','B','C','D'][i]}. {choice.text} {choice.is_correct && '✓'}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#ff5050', fontStyle: 'italic' }}>⚠️ No question configured for this category!</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--admin-border)', paddingTop: '1.5rem' }}>
              <button 
                type="button" 
                className="admin-btn-cancel" 
                onClick={() => setShowSwitchCategoryPanel(false)}
                style={{ padding: '0.6rem 3rem' }}
              >
                CLOSE EDITOR
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function AdminDashboardPage() {
  const [popupConfig, setPopupConfig] = useState(null);

  const showBeautifulPopup = (title, message, type = 'info', onConfirm = null, onCancel = null, confirmText = 'OK', cancelText = 'Cancel') => {
    setPopupConfig({ title, message, type, onConfirm, onCancel, confirmText, cancelText });
  };

  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message) => {
      showBeautifulPopup("System Alert", message, 'info');
    };
    return () => {
      window.alert = originalAlert;
    };
  }, []);

  return (
    <>
      <AdminDashboardInner showBeautifulPopup={showBeautifulPopup} />
      {popupConfig && (
        <div className="modal-overlay" style={{ zIndex: 99999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className={`modal-content glass-card glow-${popupConfig.type === 'error' ? 'red' : popupConfig.type === 'success' ? 'green' : popupConfig.type === 'warning' ? 'yellow' : 'blue'}`} style={{ maxWidth: '450px', width: '90%', padding: '2rem', textAlign: 'center', animation: 'scaleUp 0.3s ease', borderRadius: '12px' }}>
            <h2 style={{
              color: popupConfig.type === 'error' ? 'var(--admin-red)' : popupConfig.type === 'success' ? '#4caf50' : popupConfig.type === 'warning' ? '#ff9800' : 'var(--admin-cyan)',
              marginTop: 0,
              marginBottom: '1rem',
              fontSize: '1.8rem',
              letterSpacing: '0.05em',
              fontWeight: '900'
            }}>
              {popupConfig.type === 'error' ? '🚨 ' : popupConfig.type === 'success' ? '🎉 ' : popupConfig.type === 'warning' ? '⚠️ ' : '💡 '}
              {popupConfig.title}
            </h2>
            <p style={{ fontSize: '1.05rem', lineHeight: '1.5', margin: '0 0 2rem 0', color: 'rgba(255, 255, 255, 0.95)', whiteSpace: 'pre-line' }}>
              {popupConfig.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              {popupConfig.onCancel && (
                <button 
                  className="prelim-reset-btn" 
                  onClick={() => {
                    popupConfig.onCancel();
                    setPopupConfig(null);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    padding: '0.6rem 2rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {popupConfig.cancelText || 'Cancel'}
                </button>
              )}
              <button 
                className="btn-submit" 
                onClick={() => {
                  if (popupConfig.onConfirm) popupConfig.onConfirm();
                  setPopupConfig(null);
                }}
                style={{
                  padding: '0.6rem 2.5rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: popupConfig.type === 'error' 
                    ? 'linear-gradient(135deg, #f44336 0%, #c62828 100%)' 
                    : popupConfig.type === 'success' 
                      ? 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)' 
                      : popupConfig.type === 'warning'
                        ? 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)'
                        : 'linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: '900',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
                }}
              >
                {popupConfig.confirmText || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminDashboardPage;
