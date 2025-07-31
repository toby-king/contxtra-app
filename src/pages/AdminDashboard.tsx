import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, TrendingUp, ThumbsUp, ThumbsDown, Eye, AlertCircle, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  links_analyzed: number;
  visit_count: number;
  positive_ratings: number;
  negative_ratings: number;
  is_admin: boolean;
}

interface AdminStats {
  totalUsers: number;
  totalLinksAnalyzed: number;
  totalVisits: number;
  totalPositiveRatings: number;
  totalNegativeRatings: number;
  averageLinksPerUser: number;
  averageVisitsPerUser: number;
}

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sortBy, setSortBy] = useState<keyof UserProfile>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/');
        return;
      }

      setCurrentUser(user);

      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.is_admin) {
        setError('Access denied. Admin privileges required.');
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      // If admin, fetch all user data
      await fetchAllUsers();
    } catch (err) {
      setError('Failed to verify admin access');
      console.error('Admin access check failed:', err);
    }
  };

  const fetchAllUsers = async () => {
    try {
      setIsLoading(true);
      
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      setUsers(usersData || []);
      calculateStats(usersData || []);
    } catch (err) {
      setError('Failed to fetch user data');
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (userData: UserProfile[]) => {
    // Filter out selected users from statistics
    const filteredUsers = userData.filter(user => !selectedUsers.has(user.id));
    
    const totalUsers = filteredUsers.length;
    const totalLinksAnalyzed = filteredUsers.reduce((sum, user) => sum + user.links_analyzed, 0);
    const totalVisits = filteredUsers.reduce((sum, user) => sum + user.visit_count, 0);
    const totalPositiveRatings = filteredUsers.reduce((sum, user) => sum + user.positive_ratings, 0);
    const totalNegativeRatings = filteredUsers.reduce((sum, user) => sum + user.negative_ratings, 0);

    setStats({
      totalUsers,
      totalLinksAnalyzed,
      totalVisits,
      totalPositiveRatings,
      totalNegativeRatings,
      averageLinksPerUser: totalUsers > 0 ? Math.round((totalLinksAnalyzed / totalUsers) * 100) / 100 : 0,
      averageVisitsPerUser: totalUsers > 0 ? Math.round((totalVisits / totalUsers) * 100) / 100 : 0,
    });
  };

  // Recalculate stats when selected users change
  React.useEffect(() => {
    if (users.length > 0) {
      calculateStats(users);
    }
  }, [selectedUsers, users]);

  const handleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(user => user.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedUsers(new Set());
  };

  const handleSort = (column: keyof UserProfile) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-[24px] p-8 shadow-md max-w-md w-full mx-4">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle size={24} />
            <h2 className="text-xl font-semibold">Access Denied</h2>
          </div>
          <p className="text-slate-700 mb-6">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#622D91] hover:bg-[#4a2170] text-white rounded-[24px] transition-colors duration-200"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[#622D91] hover:text-[#4a2170] transition-colors duration-200 mb-6"
          >
            <ArrowLeft size={20} />
            Back to CONTXTRA
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Admin Dashboard</h1>
              <p className="text-slate-600">Monitor user metrics and platform analytics</p>
            </div>
            <div className="flex items-center gap-4">
              <img src="/icon.png" alt="Logo" className="w-10 h-10" />
              <img src="/textmark.png" alt="CONTXTRA Logo" className="h-6" />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-[#622D91]" size={32} />
            <span className="ml-3 text-slate-600">Loading dashboard data...</span>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {selectedUsers.size > 0 && (
                  <div className="col-span-full bg-blue-50 border border-blue-200 rounded-[24px] p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-blue-800">
                          {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} excluded from statistics
                        </span>
                      </div>
                      <button
                        onClick={handleClearSelection}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        Clear selection
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="bg-white rounded-[24px] p-6 shadow-md">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="text-blue-600" size={24} />
                    <h3 className="font-semibold text-slate-800">Total Users</h3>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalUsers}</p>
                </div>

                <div className="bg-white rounded-[24px] p-6 shadow-md">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="text-green-600" size={24} />
                    <h3 className="font-semibold text-slate-800">Links Analyzed</h3>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalLinksAnalyzed}</p>
                  <p className="text-sm text-slate-600">Avg: {stats.averageLinksPerUser} per user</p>
                </div>

                <div className="bg-white rounded-[24px] p-6 shadow-md">
                  <div className="flex items-center gap-3 mb-2">
                    <Eye className="text-purple-600" size={24} />
                    <h3 className="font-semibold text-slate-800">Total Visits</h3>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalVisits}</p>
                  <p className="text-sm text-slate-600">Avg: {stats.averageVisitsPerUser} per user</p>
                </div>

                <div className="bg-white rounded-[24px] p-6 shadow-md">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex gap-1">
                      <ThumbsUp className="text-green-600" size={20} />
                      <ThumbsDown className="text-red-600" size={20} />
                    </div>
                    <h3 className="font-semibold text-slate-800">Ratings</h3>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <p className="text-lg font-bold text-green-600">{stats.totalPositiveRatings}</p>
                      <p className="text-xs text-slate-600">Positive</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-red-600">{stats.totalNegativeRatings}</p>
                      <p className="text-xs text-slate-600">Negative</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Users Table */}
            <div className="bg-white rounded-[24px] shadow-md overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800">User Details</h2>
                    <p className="text-slate-600 mt-1">Complete user metrics and activity data</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSelectAll}
                      className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-colors"
                    >
                      {selectedUsers.size === users.length ? 'Deselect All' : 'Select All'}
                    </button>
                    {selectedUsers.size > 0 && (
                      <button
                        onClick={handleClearSelection}
                        className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-full transition-colors"
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedUsers.size === users.length && users.length > 0}
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                        />
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                        onClick={() => handleSort('email')}
                      >
                        Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                        onClick={() => handleSort('full_name')}
                      >
                        Name {sortBy === 'full_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                        onClick={() => handleSort('created_at')}
                      >
                        Joined {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                        onClick={() => handleSort('links_analyzed')}
                      >
                        Links {sortBy === 'links_analyzed' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                        onClick={() => handleSort('visit_count')}
                      >
                        Visits {sortBy === 'visit_count' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                        onClick={() => handleSort('positive_ratings')}
                      >
                        Positive {sortBy === 'positive_ratings' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                        onClick={() => handleSort('negative_ratings')}
                      >
                        Negative {sortBy === 'negative_ratings' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Admin
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {sortedUsers.map((user) => (
                      <tr 
                        key={user.id} 
                        className={`hover:bg-slate-50 ${selectedUsers.has(user.id) ? 'bg-blue-50' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.id)}
                            onChange={() => handleUserSelection(user.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {user.full_name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {user.links_analyzed}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {user.visit_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          {user.positive_ratings}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          {user.negative_ratings}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {user.is_admin ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                              User
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;