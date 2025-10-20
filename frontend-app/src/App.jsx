import React, { useEffect, useCallback, useReducer } from 'react';
import './App.css'

const API_BASE_URL = 'https://backend-sdev255-final-project.onrender.com/api';
const MOCK_USER_ROLE = 'teacher'; 

const defaultFormData = { name: '', subject: '', number: '', description: '', credits: 3 };

const initialState = {
    courses: [],
    loading: true,
    error: null,
    
    activeView: 'catalog',
    
    isFormOpen: false,
    currentCourseToEdit: null, 
    formMessage: { type: '', text: '' },
    courseFormData: defaultFormData,
};

function courseReducer(state, action) {
    switch (action.type) {
        case 'SET_VIEW':
            return { ...state, activeView: action.payload, error: null };
            
        case 'FETCH_START':
            return { ...state, loading: true, error: null };
        case 'FETCH_SUCCESS':
            return { ...state, loading: false, courses: action.payload, error: null };
        case 'FETCH_FAILURE':
            return { ...state, loading: false, error: action.payload };

        case 'OPEN_ADD_FORM':
            return {
                ...state,
                isFormOpen: true,
                currentCourseToEdit: null,
                courseFormData: defaultFormData,
                formMessage: { type: '', text: '' },
            };
        case 'OPEN_EDIT_FORM':
            return {
                ...state,
                isFormOpen: true,
                currentCourseToEdit: action.payload,
                courseFormData: { ...action.payload }, 
                formMessage: { type: '', text: '' },
            };
        case 'CLOSE_FORM':
            return {
                ...state,
                isFormOpen: false,
                currentCourseToEdit: null,
                courseFormData: defaultFormData,
                formMessage: { type: '', text: '' },
            };

        case 'SET_FORM_MESSAGE':
            return { ...state, formMessage: action.payload };
            
        case 'SET_FORM_FIELD':
             return { 
                ...state, 
                courseFormData: { 
                    ...state.courseFormData, 
                    [action.field]: action.value 
                } 
             };

        case 'COURSE_DELETED_SUCCESS':
            return {
                ...state,
                courses: state.courses.filter(c => c._id !== action.payload.courseId),
                formMessage: { type: 'success', text: action.payload.message },
            };
            
        case 'COURSE_ADDED_SUCCESS':
            return {
                ...state,
                courses: [...state.courses, action.payload],
            };
        
        case 'COURSE_UPDATED_SUCCESS':
            return {
                ...state,
                courses: state.courses.map(course => 
                    course._id === action.payload._id ? action.payload : course
                ),
            };
            
        default:
            return state;
    }
}

// -----------------------------------------------------------------
// --- Components Moved Outside of App ---
// -----------------------------------------------------------------

const NavBar = ({ activeView, dispatch }) => (
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
                        <button
                            onClick={() => dispatch({ type: 'SET_VIEW', payload: 'schedule' })}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition duration-150 ${activeView === 'schedule' ? 'bg-indigo-800 text-white shadow-inner' : 'text-indigo-200 hover:bg-indigo-600 hover:text-white'}`}
                        >
                            My Schedule 
                        </button>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <span className="text-indigo-200 text-sm hidden sm:inline">
                        Role: <span className="font-semibold capitalize">{MOCK_USER_ROLE}</span>
                    </span>
                    <button className="px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-md shadow-sm hover:bg-red-600 transition duration-150">
                        Login / Logout 
                    </button>
                </div>
            </div>
        </div>
    </nav>
);

const MainMessage = ({ isFormOpen, formMessage }) => {
    // This component now correctly shows non-form messages (like delete success/error)
    if (isFormOpen || !formMessage.text) return null;

    const isSuccess = formMessage.type === 'success';
    const isError = formMessage.type === 'error';

    // Only render if it's a success or error message meant for the main view
    if (!isSuccess && !isError) return null;

    return (
        <div className={`mb-6 rounded-md border px-4 py-3 ${
            isSuccess 
                ? 'bg-green-100 border-green-400 text-green-700' 
                : 'bg-red-100 border-red-400 text-red-700'
            }`} 
            role="alert"
        >
            {formMessage.text}
        </div>
    );
};

const CourseList = ({ loading, error, courses, handleEditClick, handleDelete }) => {
    if (loading) {
        return <p className="text-gray-600 p-8 text-center text-lg">Loading courses...</p>;
    }

    if (error) {
        return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md m-4" role="alert">{error}</div>;
    }

    // Removed redundant success message. MainMessage handles this now.

    if (courses.length === 0) {
        return <p className="text-gray-600 p-8 text-center text-lg">No courses found. Click "Add New Course" to begin.</p>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
                <div
                    key={course._id}
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
                            <button
                                onClick={() => handleEditClick(course)}
                                className="text-indigo-600 bg-indigo-100 p-2 rounded-full hover:bg-indigo-200 transition duration-150 shadow-md"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleDelete(course._id, course.name)}
                                className="text-red-600 bg-red-100 p-2 rounded-full hover:bg-red-200 transition duration-150 shadow-md"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
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
                    <button
                        onClick={closeForm}
                        className="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100"
                    >
                        X
                    </button>
                </div>

                {formMessage.text && (
                    <div className={`p-3 mb-4 rounded-lg text-sm font-medium ${
                        formMessage.type === 'error' ? 'bg-red-100 text-red-700 border border-red-400' :
                        formMessage.type === 'success' ? 'bg-green-100 text-green-700 border border-green-400' :
                        'bg-blue-100 text-blue-700'
                    }`}>
                        {formMessage.text}
                    </div>
                )}

                <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Course Name*</label>
                            <input
                                type="text"
                                name="name"
                                value={courseFormData.name || ''}
                                onChange={handleInputChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border"
                                required
                            />
                        </div>
                        <div className="flex space-x-3">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700">Subject*</label>
                                <input
                                    type="text"
                                    name="subject"
                                    value={courseFormData.subject || ''}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border"
                                    required
                                />
                            </div>
                            <div className="w-20">
                                <label className="block text-sm font-medium text-gray-700">Number*</label>
                                <input
                                    type="number"
                                    name="number"
                                    value={courseFormData.number || ''}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border"
                                    min="0"
                                    max="9999"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Credits* (1-5)</label>
                        <input
                            type="number"
                            name="credits"
                            value={courseFormData.credits || ''}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border"
                            min="0"
                            max="5"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            name="description"
                            value={courseFormData.description || ''}
                            onChange={handleInputChange}
                            rows="3"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border"
                        ></textarea>
                    </div>

                    <div className="pt-4 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={closeForm}
                            className="px-5 py-2 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400 transition duration-150"
                        >
                            {formMessage.type === 'success' ? 'Close' : 'Cancel'}
                        </button>
                        <button
                            type="submit"
                            disabled={formMessage.type === 'loading' || formMessage.type === 'success'}
                            className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-semibold shadow-lg hover:bg-indigo-700 transition duration-150 disabled:opacity-50"
                        >
                            {formMessage.type === 'loading' ? 'Processing...' : isEditing ? 'Update Course' : 'Create Course'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// -----------------------------------------------------------------
// --- The Main App Component ---
// -----------------------------------------------------------------

const App = () => {
    const [state, dispatch] = useReducer(courseReducer, initialState);
    
    const { 
        courses, loading, error, isFormOpen, activeView, 
        currentCourseToEdit, formMessage, courseFormData 
    } = state;

    const fetchCourses = useCallback(async () => {
        dispatch({ type: 'FETCH_START' });
        try {
            const response = await fetch(`${API_BASE_URL}/courses`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            dispatch({ type: 'FETCH_SUCCESS', payload: data });
        } catch (e) {
            console.error("Failed to fetch courses:", e);
            dispatch({ type: 'FETCH_FAILURE', payload: "Could not connect to the backend API. Please ensure the Express server is running." });
        }
    }, []);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    const handleEditClick = (course) => {
        dispatch({ type: 'OPEN_EDIT_FORM', payload: course });
    };

    const handleDelete = async (courseId, courseName) => {
        const isConfirmed = window.confirm(`Are you sure you want to delete the course "${courseName}"? This action cannot be undone.`);
        
        if (!isConfirmed) {
            return;
        }

        // TODO: Add 'Authorization' header here once auth is implemented
        // const token = state.token;

        try {
            const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
                method: 'DELETE',
                // headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 204) {
                dispatch({ 
                    type: 'COURSE_DELETED_SUCCESS', 
                    payload: { 
                        courseId, 
                        message: `Course "${courseName}" deleted successfully.` 
                    } 
                });
                setTimeout(() => dispatch({ type: 'SET_FORM_MESSAGE', payload: { type: '', text: '' } }), 3000);
            } else if (response.status === 404) {
                 dispatch({ type: 'SET_FORM_MESSAGE', payload: { type: 'error', text: `Course not found.` } });
            } else {
                 throw new Error(`Deletion failed with status: ${response.status}`);
            }

        } catch (e) {
            console.error("Failed to delete course:", e);
            dispatch({ type: 'SET_FORM_MESSAGE', payload: { type: 'error', text: `Deletion failed: ${e.message}` } });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        const processedValue = (name === 'number' || name === 'credits')
            ? (value === '' ? '' : Number(value))
            : value;
        
        dispatch({ 
            type: 'SET_FORM_FIELD', 
            field: name, 
            value: processedValue 
        });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const isEditing = !!currentCourseToEdit;
        
        dispatch({ 
            type: 'SET_FORM_MESSAGE', 
            payload: { type: 'loading', text: isEditing ? 'Updating course...' : 'Adding course...' } 
        });

        if (!courseFormData.name || !courseFormData.subject || courseFormData.number === '' || courseFormData.credits === '') {
            dispatch({ type: 'SET_FORM_MESSAGE', payload: { type: 'error', text: 'Please fill in all required fields (Name, Subject, Number, Credits).' } });
            return;
        }

        // TODO: Add 'Authorization' header here once auth is implemented
        // const token = state.token;

        try {
            const url = isEditing ? `${API_BASE_URL}/courses/${currentCourseToEdit._id}` : `${API_BASE_URL}/courses`;
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(courseFormData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `Server error: ${response.statusText}`);
            }

            const actionType = isEditing ? 'COURSE_UPDATED_SUCCESS' : 'COURSE_ADDED_SUCCESS';
            dispatch({ type: actionType, payload: result });

            dispatch({ 
                type: 'SET_FORM_MESSAGE', 
                payload: { type: 'success', text: `Course "${result.name}" ${isEditing ? 'updated' : 'added'} successfully!` }
            });

        } catch (e) {
            console.error("Failed to submit course:", e);
            dispatch({ type: 'SET_FORM_MESSAGE', payload: { type: 'error', text: `Failed to ${isEditing ? 'update' : 'add'} course: ${e.message}` } });
        }
    };

    const closeForm = () => {
        dispatch({ type: 'CLOSE_FORM' });
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <NavBar activeView={activeView} dispatch={dispatch} />
            
            <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900">
                    {activeView === 'catalog' ? 'Available Course Catalog' : 'My Student Schedule'}
                </h1>
                <p className="text-gray-600">
                    {activeView === 'catalog' ? 'Manage the complete list of available courses.' : 'Your enrolled courses and search functionality will appear here.'}
                </p>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                {activeView === 'catalog' && (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-gray-800">
                                {loading ? 'Loading...' : `${courses.length} Courses Listed`}
                            </h2>
                            <button
                                onClick={() => dispatch({ type: 'OPEN_ADD_FORM' })}
                                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg font-semibold shadow-lg hover:bg-green-600 transition duration-150"
                            >
                                <span>+ Add New Course</span>
                            </button>
                        </div>
                        
                        <MainMessage isFormOpen={isFormOpen} formMessage={formMessage} />

                        <CourseList 
                            loading={loading}
                            error={error}
                            courses={courses}
                            handleEditClick={handleEditClick}
                            handleDelete={handleDelete}
                        />
                    </>
                )}
                
                {activeView === 'schedule' && (
                    <div className="bg-white p-8 rounded-xl shadow-lg text-center border-4 border-dashed border-gray-300">
                        <p className="text-gray-500 font-medium">
                            This is the **Student Schedule** view. Login, authorization, search, and enrollment features will be implemented next.
                        </p>
                    </div>
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