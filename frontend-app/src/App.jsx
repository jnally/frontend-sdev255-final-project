import React, { useEffect, useCallback, useReducer, useState } from 'react';
import './App.css'

const API_BASE_URL = 'https://backend-sdev255-final-project.onrender.com/api';

const defaultFormData = { name: '', subject: '', number: '', description: '', credits: 3 };

const storedToken = localStorage.getItem('token');
const storedUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;

const initialState = {
    courses: [],
    loading: true,
    error: null,
    
    activeView: 'catalog',
    isFormOpen: false,
    
    user: storedUser,
    token: storedToken,
    authError: null,
    
    schedule: [],
    isScheduleLoading: false,
    
    searchTerm: '',
    
    currentCourseToEdit: null, 
    formMessage: { type: '', text: '' },
    courseFormData: defaultFormData,
};

function courseReducer(state, action) {
    switch (action.type) {
        case 'SET_VIEW':
            return { ...state, activeView: action.payload, error: null, authError: null };
            
        case 'SHOW_LOGIN_PAGE':
            return { ...state, activeView: 'login', authError: null };
        case 'SHOW_REGISTER_PAGE':
            return { ...state, activeView: 'register', authError: null };
            
        case 'AUTH_START':
            return { ...state, authError: null };
        case 'AUTH_SUCCESS':
            localStorage.setItem('token', action.payload.token);
            localStorage.setItem('user', JSON.stringify(action.payload.user));
            return { 
                ...state, 
                authError: null,
                user: action.payload.user,
                token: action.payload.token,
                activeView: 'catalog',
            };
        case 'AUTH_FAILURE':
            return { ...state, authError: action.payload };
        case 'LOGOUT':
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return {
                ...state,
                user: null,
                token: null,
                schedule: [],
                activeView: 'catalog',
            };
            
        case 'FETCH_START':
            return { ...state, loading: true, error: null };
        case 'FETCH_SUCCESS':
            return { ...state, loading: false, courses: action.payload, error: null };
        case 'FETCH_FAILURE':
            return { ...state, loading: false, error: action.payload };

        case 'OPEN_ADD_FORM':
            return { ...state, isFormOpen: true, currentCourseToEdit: null, courseFormData: defaultFormData, formMessage: { type: '', text: '' } };
        case 'OPEN_EDIT_FORM':
            return { ...state, isFormOpen: true, currentCourseToEdit: action.payload, courseFormData: { ...action.payload }, formMessage: { type: '', text: '' } };
        case 'CLOSE_FORM':
            return { ...state, isFormOpen: false, currentCourseToEdit: null, courseFormData: defaultFormData, formMessage: { type: '', text: '' } };
        case 'SET_FORM_MESSAGE':
            return { ...state, formMessage: action.payload };
        case 'SET_FORM_FIELD':
             return { ...state, courseFormData: { ...state.courseFormData, [action.field]: action.value } };
        
        case 'COURSE_DELETED_SUCCESS':
            return {
                ...state,
                courses: state.courses.filter(c => c._id !== action.payload.courseId),
                formMessage: { type: 'success', text: action.payload.message },
            };
        case 'COURSE_ADDED_SUCCESS':
            return { ...state, courses: [...state.courses, action.payload] };
        case 'COURSE_UPDATED_SUCCESS':
            return { ...state, courses: state.courses.map(course => course._id === action.payload._id ? action.payload : course) };

        case 'FETCH_SCHEDULE_START':
            return { ...state, isScheduleLoading: true, error: null };
        case 'FETCH_SCHEDULE_SUCCESS':
            return { ...state, isScheduleLoading: false, schedule: action.payload };
        case 'FETCH_SCHEDULE_FAILURE':
            return { ...state, isScheduleLoading: false, error: action.payload };
        case 'ENROLL_SUCCESS':
        case 'DROP_SUCCESS':
            return { ...state, schedule: action.payload.schedule };
            
        case 'SET_SEARCH_TERM':
            return { ...state, searchTerm: action.payload };
            
        default:
            return state;
    }
}

const NavBar = ({ user, activeView, dispatch }) => (
    <nav className="bg-indigo-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                    <span className="text-white text-xl font-extrabold tracking-wider">College Courses</span>
                    <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
                        <button
                            onClick={() => dispatch({ type: 'SET_VIEW', payload: 'catalog' })}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition duration-150 ${activeView === 'catalog' ? 'bg-indigo-800 text-white shadow-inner' : 'text-indigo-200 hover:bg-indigo-600 hover:text-white'}`}
                        >
                            Course Catalog
                        </button>
                        {user && (
                            <button
                                onClick={() => dispatch({ type: 'SET_VIEW', payload: 'schedule' })}
                                className={`px-3 py-2 rounded-md text-sm font-medium transition duration-150 ${activeView === 'schedule' ? 'bg-indigo-800 text-white shadow-inner' : 'text-indigo-200 hover:bg-indigo-600 hover:text-white'}`}
                            >
                                My Schedule 
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    {user && (
                        <span className="text-indigo-200 text-sm hidden sm:inline">
                            Role: <span className="font-semibold capitalize">{user.role}</span>
                        </span>
                    )}
                    {user ? (
                        <button 
                            onClick={() => dispatch({ type: 'LOGOUT' })}
                            className="px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-red-600 transition duration-150"
                        >
                            Logout
                        </button>
                    ) : (
                        <div className="flex items-center space-x-2">
                            <button 
                                onClick={() => dispatch({ type: 'SHOW_LOGIN_PAGE' })}
                                className="px-3 py-1 bg-green-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-green-600 transition duration-150"
                            >
                                Login
                            </button>
                            <button 
                                onClick={() => dispatch({ type: 'SHOW_REGISTER_PAGE' })}
                                className="px-3 py-1 bg-gray-100 text-indigo-700 text-sm font-medium rounded-md shadow-sm hover:bg-gray-200 transition duration-150"
                            >
                                Register
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </nav>
);

const MainMessage = ({ isFormOpen, formMessage }) => {
    if (isFormOpen || !formMessage.text) return null;
    const isSuccess = formMessage.type === 'success';
    const isError = formMessage.type === 'error';

    if (!isSuccess && !isError) return null;

    return (
        <div className={`mb-6 rounded-md border px-4 py-3 ${isSuccess ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'}`} role="alert">
            {formMessage.text}
        </div>
    );
};

const CourseCard = ({ course, user, isEnrolled, onEdit, onDelete, onEnroll, onDrop }) => {
    return (
        <div
            className="bg-white p-6 rounded-xl shadow-xl hover:shadow-2xl transition duration-300 border border-gray-100 flex flex-col"
        >
            <h3 className="text-2xl font-extrabold text-indigo-700 mb-1 leading-tight">
                {course.subject} {course.number}
            </h3>
            <p className="text-lg font-semibold text-gray-800 mb-3">{course.name}</p>
            <p className="text-sm text-gray-600 mb-4 flex-grow">{course.description || "No description provided."}</p>
            <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-md font-bold text-gray-700">
                    {course.credits} Credits
                </span>
                
                <div className="space-x-2">
                    {user && user.role === 'teacher' && onEdit && course.createdBy === user._id && (
                        <button
                            onClick={() => onEdit(course)}
                            className="text-indigo-600 bg-indigo-100 p-2 rounded-full hover:bg-indigo-200 transition duration-150 shadow-md"
                        >
                            Edit
                        </button>
                    )}
                    {user && user.role === 'teacher' && onDelete && course.createdBy === user._id && (
                        <button
                            onClick={() => onDelete(course._id, course.name)}
                            className="text-red-600 bg-red-100 p-2 rounded-full hover:bg-red-200 transition duration-150 shadow-md"
                        >
                            Delete
                        </button>
                    )}

                    {user && user.role === 'student' && onEnroll && (
                        <button
                            onClick={() => onEnroll(course._id)}
                            disabled={isEnrolled}
                            className={`p-2 rounded-full transition duration-150 shadow-md ${
                                isEnrolled 
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                                : 'bg-green-100 text-green-600 hover:bg-green-200'
                            }`}
                        >
                            {isEnrolled ? 'Enrolled' : 'Enroll'}
                        </button>
                    )}
                    {user && user.role === 'student' && onDrop && (
                        <button
                            onClick={() => onDrop(course._id)}
                            className="text-red-600 bg-red-100 p-2 rounded-full hover:bg-red-200 transition duration-150 shadow-md"
                        >
                            Drop
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const CourseList = ({ courses, user, schedule, handleEditClick, handleDelete, handleEnroll }) => {
    const enrolledCourseIds = new Set(schedule.map(c => c._id));

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
                <CourseCard
                    key={course._id}
                    course={course}
                    user={user}
                    isEnrolled={enrolledCourseIds.has(course._id)}
                    onEdit={handleEditClick}
                    onDelete={handleDelete}
                    onEnroll={handleEnroll}
                />
            ))}
        </div>
    );
};

const ScheduleList = ({ loading, error, schedule, handleDrop }) => {
    if (loading) {
        return <p className="text-gray-600 p-8 text-center text-lg">Loading schedule...</p>;
    }
    if (error) {
        return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md m-4" role="alert">{error}</div>;
    }
    if (schedule.length === 0) {
        return <p className="text-gray-600 p-8 text-center text-lg">You are not enrolled in any courses. Go to the Course Catalog to enroll.</p>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schedule.map((course) => (
                <CourseCard
                    key={course._id}
                    course={course}
                    user={{ role: 'student' }}
                    onDrop={handleDrop}
                />
            ))}
        </div>
    );
};

const CourseForm = ({ currentCourseToEdit, formMessage, courseFormData, handleFormSubmit, handleInputChange, closeForm }) => {
    const isEditing = !!currentCourseToEdit;
    const title = isEditing ? 'Edit Existing Course' : 'Add New Course';

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg transform transition-all duration-300">
                <div className="flex justify-between items-center mb-6 border-b pb-3">
                    <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
                    <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100">X</button>
                </div>

                {formMessage.text && (
                    <div className={`p-3 mb-4 rounded-lg text-sm font-medium ${
                        formMessage.type === 'error' ? 'bg-red-100 text-red-700 border border-red-400' :
                        formMessage.type === 'success' ? 'bg-green-100 text-green-700 border border-green-400' :
                        'bg-blue-100 text-blue-700'
                    }`}>{formMessage.text}</div>
                )}

                <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                             <label className="block text-sm font-medium text-gray-700">Course Name*</label>
                             <input type="text" name="name" value={courseFormData.name || ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" required />
                         </div>
                         <div className="flex space-x-3">
                             <div className="flex-1">
                                 <label className="block text-sm font-medium text-gray-700">Subject*</label>
                                 <input type="text" name="subject" value={courseFormData.subject || ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" required />
                             </div>
                             <div className="w-20">
                                 <label className="block text-sm font-medium text-gray-700">Number*</label>
                                 <input type="number" name="number" value={courseFormData.number || ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" min="0" max="9999" required />
                             </div>
                         </div>
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700">Credits* (1-5)</label>
                         <input type="number" name="credits" value={courseFormData.credits || ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" min="0" max="5" required />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700">Description</label>
                         <textarea name="description" value={courseFormData.description || ''} onChange={handleInputChange} rows="3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border"></textarea>
                    </div>

                    <div className="pt-4 flex justify-end space-x-3">
                        <button type="button" onClick={closeForm} className="px-5 py-2 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400 transition duration-150">
                            {formMessage.type === 'success' ? 'Close' : 'Cancel'}
                        </button>
                        <button type="submit" disabled={formMessage.type === 'loading' || formMessage.type === 'success'} className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-semibold shadow-lg hover:bg-indigo-700 transition duration-150 disabled:opacity-50">
                            {formMessage.type === 'loading' ? 'Processing...' : isEditing ? 'Update Course' : 'Create Course'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const LoginPage = ({ authError, dispatch, handleAuthSubmit }) => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    
    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleAuthSubmit(formData, 'login');
    };

    return (
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md mx-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-3">
                <h2 className="text-2xl font-bold text-gray-800">Login to Your Account</h2>
            </div>

            {authError && (
                <div className="bg-red-100 text-red-700 border border-red-400 p-3 mb-4 rounded-lg text-sm font-medium">
                    {authError}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Username*</label>
                    <input type="text" name="username" value={formData.username} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Password*</label>
                    <input type="password" name="password" value={formData.password} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" required />
                </div>
                <div className="pt-4 flex justify-between items-center">
                    <button
                        type="button"
                        onClick={() => dispatch({ type: 'SHOW_REGISTER_PAGE' })}
                        className="text-sm text-indigo-600 hover:underline"
                    >
                        Need an account? Register
                    </button>
                    <button
                        type="submit"
                        className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-semibold shadow-lg hover:bg-indigo-700 transition duration-150"
                    >
                        Login
                    </button>
                </div>
            </form>
        </div>
    );
};

const RegisterPage = ({ authError, dispatch, handleAuthSubmit }) => {
    const [formData, setFormData] = useState({ username: '', password: '', email: '', role: 'student' });
    
    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleAuthSubmit(formData, 'register');
    };

    return (
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md mx-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-3">
                <h2 className="text-2xl font-bold text-gray-800">Create a New Account</h2>
            </div>

            {authError && (
                <div className="bg-red-100 text-red-700 border border-red-400 p-3 mb-4 rounded-lg text-sm font-medium">
                    {authError}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Email*</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Username*</label>
                    <input type="text" name="username" value={formData.username} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Password*</label>
                    <input type="password" name="password" value={formData.password} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select name="role" value={formData.role} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border bg-white">
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                    </select>
                </div>
                <div className="pt-4 flex justify-between items-center">
                    <button
                        type="button"
                        onClick={() => dispatch({ type: 'SHOW_LOGIN_PAGE' })}
                        className="text-sm text-indigo-600 hover:underline"
                    >
                        Already have an account? Login
                    </button>
                    <button
                        type="submit"
                        className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-semibold shadow-lg hover:bg-indigo-700 transition duration-150"
                    >
                        Register
                    </button>
                </div>
            </form>
        </div>
    );
};

const App = () => {
    const [state, dispatch] = useReducer(courseReducer, initialState);
    
    const { 
        courses, loading, error, isFormOpen, activeView, 
        currentCourseToEdit, formMessage, courseFormData,
        user, token, authError,
        schedule, isScheduleLoading, searchTerm
    } = state;

    const fetchCourses = useCallback(async () => {
        dispatch({ type: 'FETCH_START' });
        try {
            const response = await fetch(`${API_BASE_URL}/courses`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            dispatch({ type: 'FETCH_SUCCESS', payload: data });
        } catch (e) {
            console.error("Failed to fetch courses:", e);
            dispatch({ type: 'FETCH_FAILURE', payload: "Could not connect to the backend API." });
        }
    }, []);

    const fetchSchedule = useCallback(async () => {
        if (!token) return;
        dispatch({ type: 'FETCH_SCHEDULE_START' });
        try {
            const response = await fetch(`${API_BASE_URL}/users/schedule`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            dispatch({ type: 'FETCH_SCHEDULE_SUCCESS', payload: data });
        } catch (e) {
            console.error("Failed to fetch schedule:", e);
            dispatch({ type: 'FETCH_SCHEDULE_FAILURE', payload: "Could not fetch schedule." });
        }
    }, [token]);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    useEffect(() => {
        if (user && activeView === 'schedule') {
            fetchSchedule();
        }
    }, [user, activeView, fetchSchedule]);

    const handleAuthSubmit = async (formData, view) => {
        dispatch({ type: 'AUTH_START' });
        const endpoint = view === 'login' ? '/users/login' : '/users/register';
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Authentication failed.');
            
            dispatch({ type: 'AUTH_SUCCESS', payload: { user: result.user, token: result.token } });

        } catch (e) {
            dispatch({ type: 'AUTH_FAILURE', payload: e.message });
        }
    };

    const handleEditClick = (course) => {
        dispatch({ type: 'OPEN_EDIT_FORM', payload: course });
    };

    const handleDelete = async (courseId, courseName) => {
        if (!token) return dispatch({ type: 'SET_FORM_MESSAGE', payload: { type: 'error', text: 'You must be logged in.' } });
        
        const isConfirmed = window.confirm(`Are you sure you want to delete "${courseName}"?`);
        if (!isConfirmed) return;

        try {
            const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 204) {
                dispatch({ type: 'COURSE_DELETED_SUCCESS', payload: { courseId, message: `Course "${courseName}" deleted.` } });
                setTimeout(() => dispatch({ type: 'SET_FORM_MESSAGE', payload: { type: '', text: '' } }), 3000);
            } else {
                const result = await response.json();
                throw new Error(result.message || `Deletion failed.`);
            }
        } catch (e) {
            console.error("Failed to delete course:", e);
            dispatch({ type: 'SET_FORM_MESSAGE', payload: { type: 'error', text: e.message } });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const processedValue = (name === 'number' || name === 'credits') ? (value === '' ? '' : Number(value)) : value;
        dispatch({ type: 'SET_FORM_FIELD', field: name, value: processedValue });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!token) return dispatch({ type: 'SET_FORM_MESSAGE', payload: { type: 'error', text: 'You must be logged in.' } });

        const isEditing = !!currentCourseToEdit;
        dispatch({ type: 'SET_FORM_MESSAGE', payload: { type: 'loading', text: isEditing ? 'Updating...' : 'Adding...' } });

        if (!courseFormData.name || !courseFormData.subject || courseFormData.number === '' || courseFormData.credits === '') {
            dispatch({ type: 'SET_FORM_MESSAGE', payload: { type: 'error', text: 'Please fill in all required fields.' } });
            return;
        }

        try {
            const url = isEditing ? `${API_BASE_URL}/courses/${currentCourseToEdit._id}` : `${API_BASE_URL}/courses`;
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(courseFormData),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || `Server error.`);

            const actionType = isEditing ? 'COURSE_UPDATED_SUCCESS' : 'COURSE_ADDED_SUCCESS';
            dispatch({ type: actionType, payload: result });
            dispatch({ type: 'SET_FORM_MESSAGE', payload: { type: 'success', text: `Course ${isEditing ? 'updated' : 'added'}!` } });
        } catch (e) {
            console.error("Failed to submit course:", e);
            dispatch({ type: 'SET_FORM_MESSAGE', payload: { type: 'error', text: e.message } });
        }
    };

    const closeForm = () => {
        dispatch({ type: 'CLOSE_FORM' });
    };

    const handleEnroll = async (courseId) => {
        if (!token) return;
        try {
            const response = await fetch(`${API_BASE_URL}/users/schedule/add`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ courseId }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Enrollment failed.');
            
            dispatch({ type: 'ENROLL_SUCCESS', payload: { schedule: result.schedule } });
        } catch (e) {
            console.error("Failed to enroll:", e);
        }
    };

    const handleDrop = async (courseId) => {
        if (!token) return;
        try {
            const response = await fetch(`${API_BASE_URL}/users/schedule/drop`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ courseId }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Drop failed.');
            
            dispatch({ type: 'DROP_SUCCESS', payload: { schedule: result.schedule } });
        } catch (e) {
            console.error("Failed to drop:", e);
        }
    };

    const filteredCourses = courses.filter(course => {
        const term = searchTerm.toLowerCase();
        const nameMatch = course.name.toLowerCase().includes(term);
        const subjectMatch = course.subject.toLowerCase().includes(term);
        const numberMatch = course.number.toString().includes(term); 
        
        return nameMatch || subjectMatch || numberMatch;
    });

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <NavBar user={user} activeView={activeView} dispatch={dispatch} />
            
            <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900">
                    {activeView === 'catalog' ? 'Available Course Catalog' :
                     activeView === 'schedule' ? 'My Student Schedule' :
                     activeView === 'login' ? 'Account Login' :
                     'Create Account'} 
                </h1>
                <p className="text-gray-600">
                    {activeView === 'catalog' ? 'Browse all available courses.' :
                     activeView === 'schedule' ? 'Manage your enrolled courses.' :
                     activeView === 'login' ? 'Please log in to continue.' :
                     'Please register to create an account.'}
                </p>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                {activeView === 'login' && (
                    <LoginPage
                        authError={authError}
                        dispatch={dispatch}
                        handleAuthSubmit={handleAuthSubmit}
                    />
                )}
                
                {activeView === 'register' && (
                    <RegisterPage
                        authError={authError}
                        dispatch={dispatch}
                        handleAuthSubmit={handleAuthSubmit}
                    />
                )}
            
                {activeView === 'catalog' && (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-gray-800">
                                {loading ? 'Loading...' : `${filteredCourses.length} Courses Found`}
                            </h2>
                            {user && user.role === 'teacher' && (
                                <button
                                    onClick={() => dispatch({ type: 'OPEN_ADD_FORM' })}
                                    className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg font-semibold shadow-lg hover:bg-green-600 transition duration-150"
                                >
                                    <span>+ Add New Course</span>
                                </button>
                            )}
                        </div>
                        
                        <div className="mb-6">
                            <input
                                type="text"
                                placeholder="Search by name, subject, or number..."
                                value={searchTerm}
                                onChange={(e) => dispatch({ type: 'SET_SEARCH_TERM', payload: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 border"
                            />
                        </div>
                        
                        <MainMessage isFormOpen={isFormOpen} formMessage={formMessage} />

                        {loading ? (
                            <p className="text-gray-600 p-8 text-center text-lg">Loading courses...</p>
                        ) : error ? (
                             <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md m-4" role="alert">{error}</div>
                        ) : filteredCourses.length === 0 ? (
                            <p className="text-gray-600 p-8 text-center text-lg">
                                {searchTerm ? "No courses match your search." : "No courses found."}
                            </p>
                        ) : (
                            <CourseList 
                                courses={filteredCourses}
                                user={user}
                                schedule={schedule}
                                handleEditClick={handleEditClick}
                                handleDelete={handleDelete}
                                handleEnroll={handleEnroll}
                            />
                        )}
                    </>
                )}
                
                {activeView === 'schedule' && (
                    !user ? (
                        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
                            <p className="text-gray-600 font-medium">Please login to view your schedule.</p>
                        </div>
                    ) : (
                        <ScheduleList
                            loading={isScheduleLoading}
                            error={error}
                            schedule={schedule}
                            handleDrop={handleDrop}
                        />
                    )
                )}
            </main>

            {isFormOpen && (
                <CourseForm 
                    currentCourseToEdit={currentCourseToEdit}
                    formMessage={formMessage}
                    courseFormData={courseFormData}
                    handleFormSubmit={handleFormSubmit}
                    handleInputChange={handleInputChange}
                    closeForm={closeForm}
                />
            )}
            
        </div>
    );
};

export default App;