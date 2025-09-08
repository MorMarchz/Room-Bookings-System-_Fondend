import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function BookingListScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [userRole, setUserRole] = useState(null); // เพิ่ม state สำหรับ role

  // Edit modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editStartDatetime, setEditStartDatetime] = useState('');
  const [editEndDatetime, setEditEndDatetime] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [updating, setUpdating] = useState(false);
  
  // Delete modal states
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [deleting, setDeleting] = useState(null); // เก็บ ID ของการจองที่กำลังลบ
  
  // Notification state
  const [notification, setNotification] = useState({
    visible: false,
    message: '',
    type: 'success', // 'success', 'error', 'warning'
  });

  // ฟังก์ชันแสดง notification
  const showNotification = (message, type = 'success') => {
    setNotification({
      visible: true,
      message,
      type,
    });
    
    // ซ่อน notification หลัง 3 วินาที
    setTimeout(() => {
      setNotification({
        visible: false,
        message: '',
        type: 'success',
      });
    }, 3000);
  };

  // ตรวจสอบ authentication เมื่อ screen focus
  useFocusEffect(
    React.useCallback(() => {
      checkAuthentication();
    }, [])
  );

  // ฟังก์ชันถอดรหัส JWT เพื่อดึง user ID
  const decodeJWT = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  };

  // ฟังก์ชัน clear ข้อมูล booking และ reset state
  const clearBookingData = () => {
    console.log('🗑️ Clearing booking data');
    setBookings([]);
    setUserToken(null);
    setLoading(false);
    setRefreshing(false);
  };

  const checkAuthentication = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('jwt_token');
      let userId = await AsyncStorage.getItem('userId') || await AsyncStorage.getItem('user_id');
      
      console.log('=== Authentication Check ===');
      console.log('Token found:', token ? 'Yes' : 'No');
      console.log('User ID found:', userId ? 'Yes' : 'No');
      
      if (!token) {
        // ⚠️ สำคัญ: Clear ข้อมูล bookings เมื่อไม่ได้ login
        clearBookingData();
        
        showNotification('กรุณาเข้าสู่ระบบก่อนดูรายการการจอง', 'warning');
        setTimeout(() => navigation.navigate('Profile'), 1500);
        return;
      }


      // หากไม่มี userId ให้ดึงจาก token และดึง role
      if (token) {
        const decodedToken = decodeJWT(token);
        if (decodedToken) {
          if (decodedToken.id && !userId) {
            userId = decodedToken.id;
            await AsyncStorage.setItem('userId', userId);
            console.log('Extracted User ID from token:', userId);
          }
          if (decodedToken.role) {
            setUserRole(decodedToken.role);
            console.log('User role:', decodedToken.role);
          }
        }
      }

      console.log('Final User ID:', userId);
      
      if (!userId) {
        // ⚠️ สำคัญ: Clear ข้อมูล bookings เมื่อไม่มี userId
        clearBookingData();
        
        showNotification('ไม่สามารถระบุตัวตนผู้ใช้ได้ กรุณาเข้าสู่ระบบใหม่', 'error');
        setTimeout(() => navigation.navigate('Profile'), 1500);
        return;
      }
      
      setUserToken(token);
      // fetchBookings จะถูกเรียกโดย useEffect เมื่อ userRole และ userToken พร้อม
    } catch (error) {
      console.error('Error checking authentication:', error);
      // ⚠️ สำคัญ: Clear ข้อมูล bookings เมื่อเกิดข้อผิดพลาด
      clearBookingData();
      showNotification('ไม่สามารถตรวจสอบสถานะการเข้าสู่ระบบได้', 'error');
    }
  };

  // เรียก fetchBookings เมื่อ userRole และ userToken พร้อม
  useEffect(() => {
    console.log('=== useEffect triggered ===');
    console.log('userToken:', userToken ? 'Present' : 'Missing');
    console.log('userRole:', userRole);
    
    if (userToken && userRole) {
      console.log('Calling fetchBookings with role:', userRole);
      fetchBookings();
    } else {
      console.log('Waiting for userToken and userRole to be ready...');
    }
  }, [userToken, userRole]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      console.log('=== Fetching Bookings START ===');
      console.log('Current userRole:', userRole);
      console.log('Role check: userRole !== "admin":', userRole !== 'admin');
      
      const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('jwt_token');
      let userId = await AsyncStorage.getItem('userId') || await AsyncStorage.getItem('user_id');

      console.log('=== Fetching Bookings ===');
      console.log('Token:', token ? 'Present' : 'Missing');

      if (!token) {
        console.log('Missing token, clearing bookings and aborting fetch');
        clearBookingData(); // ⚠️ ใช้ฟังก์ชัน clear แทน
        return;
      }

      // หากไม่มี userId ให้ดึงจาก token
      if (!userId && token) {
        const decodedToken = decodeJWT(token);
        if (decodedToken && decodedToken.id) {
          userId = decodedToken.id;
          await AsyncStorage.setItem('userId', userId);
          console.log('Extracted User ID from token in fetch:', userId);
        }
      }

      console.log('User ID for filtering:', userId);

      if (!userId) {
        console.log('Missing userId, clearing bookings and aborting fetch');
        clearBookingData(); // ⚠️ ใช้ฟังก์ชัน clear แทน
        return;
      }

      console.log('Making API call to: http://localhost:5001/api/bookings_list');
      
      const response = await fetch('http://localhost:5001/api/bookings_list', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('API Response Status:', response.status);
      console.log('API Response OK:', response.ok);

      if (response.status === 401) {
        console.log('401 Unauthorized - Token expired, clearing data');
        clearBookingData(); // ⚠️ ใช้ฟังก์ชัน clear แทน
        
        showNotification('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่', 'warning');
        setTimeout(async () => {
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.removeItem('userId');
          await AsyncStorage.removeItem('jwt_token');
          await AsyncStorage.removeItem('user_id');
          navigation.navigate('Profile');
        }, 1500);
        return;
      }

      if (!response.ok) {
        console.log('API Error - Status:', response.status);
        clearBookingData(); // ⚠️ ใช้ฟังก์ชัน clear แทน
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw API Data:', data);
      console.log('Data length:', data.length);
      
      // ถ้า admin ให้เห็นทุก booking, ถ้าไม่ใช่ admin ให้เห็นเฉพาะของตัวเอง
      let bookingsToShow = data;
      if (userRole !== 'admin') {
        bookingsToShow = data.filter(booking => {
          console.log('Comparing booking.user_id:', booking.user_id, 'with userId:', userId);
          return booking.user_id === userId || booking.user_id?.toString() === userId?.toString();
        });
        console.log('Filtered User Bookings:', bookingsToShow);
        console.log('User Bookings length:', bookingsToShow.length);
      } else {
        console.log('Admin: Show all bookings', bookingsToShow.length);
      }
      setBookings(bookingsToShow);
      
    } catch (error) {
      console.error('Error fetching bookings:', error);
      clearBookingData(); // ⚠️ ใช้ฟังก์ชัน clear แทน
      showNotification('ไม่สามารถโหลดรายการการจองได้ กรุณาลองใหม่อีกครั้ง', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  // ฟังก์ชันเปิด modal แก้ไข
  const openEditModal = (booking) => {
    setSelectedBooking(booking);
    
    // แปลงเวลาให้อยู่ในรูปแบบที่แก้ไขได้
    const startDate = new Date(booking.start_datetime?.$date || booking.start_datetime);
    const endDate = new Date(booking.end_datetime?.$date || booking.end_datetime);
    
    const formatForInput = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    };
    
    setEditStartDatetime(formatForInput(startDate));
    setEditEndDatetime(formatForInput(endDate));
    setEditDuration(booking.duration_hours?.toString() || '');
    setEditModalVisible(true);
  };

  // ฟังก์ชันปิด modal แก้ไข
  const closeEditModal = () => {
    setEditModalVisible(false);
    setSelectedBooking(null);
    setEditStartDatetime('');
    setEditEndDatetime('');
    setEditDuration('');
  };

  // ฟังก์ชันอัพเดทการจอง
  const updateBooking = async () => {
    if (!editStartDatetime || !editEndDatetime || !editDuration) {
      showNotification('กรุณากรอกข้อมูลให้ครบ', 'warning');
      return;
    }

    try {
      setUpdating(true);
      
      // แปลงวันที่ให้เป็นรูปแบบ ISO string
      const startDate = new Date(editStartDatetime);
      const endDate = new Date(editEndDatetime);
      
      // ตรวจสอบความถูกต้องของวันที่
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        showNotification('รูปแบบวันที่ไม่ถูกต้อง กรุณากรอกวันที่ในรูปแบบ YYYY-MM-DD HH:MM', 'error');
        return;
      }

      if (startDate >= endDate) {
        showNotification('เวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด', 'error');
        return;
      }

      const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('jwt_token');
      if (!token) {
        showNotification('กรุณาเข้าสู่ระบบใหม่', 'warning');
        return;
      }

      const updateData = {
        start_datetime: startDate.toISOString(),
        end_datetime: endDate.toISOString(),
        duration_hours: Number(editDuration)
      };

      console.log('=== UPDATE BOOKING DEBUG ===');
      console.log('Selected booking:', selectedBooking);
      console.log('Booking ID:', selectedBooking._id || selectedBooking.id);
      console.log('Update data:', updateData);
      console.log('Token present:', !!token);

      // ใช้ endpoint ที่ Backend รองรับ: /api/bookings_list/update/:id
      const bookingId = selectedBooking._id || selectedBooking.id;
      const apiUrl = `http://localhost:5001/api/bookings_list/update/${bookingId}`;
      console.log('API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();
      console.log('API Response Status:', response.status);
      console.log('API Response Data:', result);

      if (response.ok) {
        showNotification('แก้ไขการจองเรียบร้อยแล้ว', 'success');
        closeEditModal();
        fetchBookings(); // รีเฟรชข้อมูล
      } else {
        if (response.status === 404) {
          showNotification('ไม่พบการจองที่ต้องการแก้ไข', 'error');
        } else if (response.status === 403) {
          showNotification('คุณไม่สามารถแก้ไขการจองนี้ได้', 'error');
        } else {
          const errorMessage = result.message || result.error || `HTTP ${response.status}: ${response.statusText}`;
          showNotification(`แก้ไขไม่สำเร็จ: ${errorMessage}`, 'error');
        }
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      showNotification(`ไม่สามารถแก้ไขการจองได้: ${error.message}`, 'error');
    } finally {
      setUpdating(false);
    }
  };

  // ฟังก์ชันสำหรับเติมเวลาปัจจุบัน
  const setCurrentDateTimeForEdit = (type) => {
    const now = new Date();
    if (type === 'start') {
      const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setEditStartDatetime(formatted);
    } else {
      now.setHours(now.getHours() + 2);
      const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setEditEndDatetime(formatted);
      setEditDuration('2');
    }
  };

  // ฟังก์ชันลบการจอง
  const deleteBooking = async (booking) => {
    console.log('=== DELETE BOOKING CLICKED ===');
    console.log('Booking to delete:', booking);
    console.log('User token exists:', !!userToken);
    
    // เก็บข้อมูลการจองที่จะลบและแสดง modal
    setBookingToDelete(booking);
    setDeleteModalVisible(true);
  };

  // ฟังก์ชันยืนยันการลบ
  const confirmDeleteBooking = async (booking) => {
    console.log('=== CONFIRM DELETE BOOKING START ===');
    console.log('Booking data:', booking);
    
    try {
      const bookingId = booking._id || booking.id;
      console.log('Booking ID extracted:', bookingId);
      
      setDeleting(bookingId); // แสดง loading สำหรับการจองนี้
      console.log('Set deleting state to:', bookingId);
      
      const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('jwt_token');
      console.log('Token retrieved:', token ? 'Present' : 'Missing');
      
      if (!token) {
        console.log('No token found, showing notification');
        showNotification('กรุณาเข้าสู่ระบบใหม่', 'warning');
        return;
      }

      const apiUrl = `http://localhost:5001/api/bookings_list/delete/${bookingId}`;
      
      console.log('=== DELETE BOOKING DEBUG ===');
      console.log('Deleting booking:', booking);
      console.log('Booking ID:', bookingId);
      console.log('API URL:', apiUrl);
      console.log('Token present:', !!token);

      console.log('Making DELETE request...');
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('DELETE response received');
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      let result;
      try {
        result = await response.json();
        console.log('Response JSON:', result);
      } catch (jsonError) {
        console.log('Failed to parse JSON response:', jsonError);
        result = { error: 'Invalid response format' };
      }

      console.log('Delete Response Status:', response.status);
      console.log('Delete Response Data:', result);

      if (response.ok) {
        console.log('Delete successful!');
        showNotification('ลบการจองเรียบร้อยแล้ว', 'success');
        fetchBookings(); // รีเฟรชข้อมูล
      } else {
        console.log('Delete failed with status:', response.status);
        if (response.status === 404) {
          showNotification('ไม่พบการจองที่ต้องการลบ', 'error');
        } else if (response.status === 403) {
          showNotification('คุณไม่สามารถลบการจองนี้ได้', 'error');
        } else {
          const errorMessage = result.message || result.error || `HTTP ${response.status}: ${response.statusText}`;
          showNotification(`ลบไม่สำเร็จ: ${errorMessage}`, 'error');
        }
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      showNotification(`ไม่สามารถลบการจองได้: ${error.message}`, 'error');
    } finally {
      console.log('Clearing deleting state');
      setDeleting(null); // ซ่อน loading
      setBookingToDelete(null); // ล้างข้อมูลการจองที่เลือก
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'ไม่ระบุ';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'รูปแบบวันที่ไม่ถูกต้อง';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return '#28a745'; // สีเขียว
      case 'confirmed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'cancelled':
        return '#F44336';
      case 'rejected':
        return '#dc3545'; // สีแดง
      default:
        return '#757575';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'อนุมัติแล้ว';
      case 'confirmed':
        return 'ยืนยันแล้ว';
      case 'pending':
        return 'รอยืนยัน';
      case 'cancelled':
        return 'ยกเลิกแล้ว';
      case 'rejected':
        return 'ปฏิเสธ';
      default:
        return status;
    }
  };

  const renderBookingItem = ({ item }) => {
    // ตรวจสอบว่าสามารถแก้ไขได้หรือไม่ (เฉพาะสถานะ pending หรือ confirmed)
    const canEdit = item.status === 'pending' || item.status === 'confirmed';
    return (
      <View style={styles.bookingCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.roomName}>ห้อง {item.room_name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.fullName}>ผู้จอง: {item.fullname || 'ไม่ระบุ'}</Text>
          <View style={styles.dateTimeContainer}>
            <Text style={styles.label}>เริ่ม:</Text>
            <Text style={styles.dateTime}>
              {formatDateTime(item.start_datetime?.$date || item.start_datetime)}
            </Text>
          </View>
          <View style={styles.dateTimeContainer}>
            <Text style={styles.label}>สิ้นสุด:</Text>
            <Text style={styles.dateTime}>
              {formatDateTime(item.end_datetime?.$date || item.end_datetime)}
            </Text>
          </View>
          <View style={styles.durationContainer}>
            <Text style={styles.label}>ระยะเวลา:</Text>
            <Text style={styles.duration}>{item.duration_hours} ชั่วโมง</Text>
          </View>
          {item.created_at && (
            <View style={styles.createdAtContainer}>
              <Text style={styles.createdAtLabel}>จองเมื่อ:</Text>
              <Text style={styles.createdAt}>
                {formatDateTime(item.created_at)}
              </Text>
            </View>
          )}
          {/* ปุ่มแก้ไขและลบ */}
          {canEdit && userToken && (
            <View style={styles.actionButtonsContainer}>
              {/* แถวที่ 1: ปุ่มแก้ไข และ ลบ (ของ user) */}
              <View style={styles.userActionsRow}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => openEditModal(item)}
                  disabled={deleting === (item._id || item.id)}
                >
                  <Text style={styles.editButtonText}>✏️ แก้ไขเวลา</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.deleteButtonInList,
                    deleting === (item._id || item.id) && styles.buttonDisabled
                  ]}
                  onPress={() => deleteBooking(item)}
                  disabled={deleting === (item._id || item.id)}
                >
                  <Text style={styles.deleteButtonInListText}>
                    {deleting === (item._id || item.id) ? '🔄 กำลังลบ...' : '🗑️ ลบการจอง'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {/* ปุ่ม admin - แสดงได้ทุก status */}
          {userRole === 'admin' && userToken && (
            <View style={styles.actionButtonsContainer}>
              <View style={styles.adminActionsRow}>
                {/* ปุ่มอนุมัติสำหรับ admin */}
                {item.status === 'pending' && (
                  <TouchableOpacity
                    style={styles.approveButton}
                    onPress={() => approveBooking(item)}
                    disabled={item.approving}
                  >
                    <Text style={styles.approveButtonText}>{item.approving ? '⏳ กำลังอนุมัติ...' : '✅ อนุมัติ'}</Text>
                  </TouchableOpacity>
                )}
                {/* ปุ่มลบ (Admin) สำหรับ admin - ลบ booking ของใครก็ได้ */}
                <TouchableOpacity
                  style={[
                    styles.adminDeleteButton,
                    item.adminDeleting && styles.buttonDisabled
                  ]}
                  onPress={() => adminDeleteBooking(item)}
                  disabled={item.adminDeleting}
                >
                  <Text style={styles.adminDeleteButtonText}>
                    {item.adminDeleting ? '🔄 กำลังลบ...' : '🗑️ ลบ (Admin)'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  // ===== ฟังก์ชันอนุมัติการจอง (admin) =====
  const approveBooking = async (booking) => {
    try {
      const bookingId = booking._id || booking.id;
      setBookings(prev => prev.map(b => (b._id === bookingId ? { ...b, approving: true } : b)));
      
      const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('jwt_token');
      if (!token) {
        showNotification('กรุณาเข้าสู่ระบบใหม่', 'warning');
        return;
      }
      
      const apiUrl = `http://localhost:5001/api/admin_update/${bookingId}`;
      const requestBody = { 
        status: 'approved',
        type: 'booking' // แก้เป็น 'booking' ตาม requirement ของ backend
      };
      
      console.log('=== APPROVE BOOKING DEBUG ===');
      console.log('Booking to approve:', booking);
      console.log('Booking ID:', bookingId);
      console.log('API URL:', apiUrl);
      console.log('Request Body:', requestBody);
      console.log('Token present:', !!token);
      console.log('User role:', userRole);
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('Response Status:', response.status);
      console.log('Response OK:', response.ok);
      
      let result;
      try {
        result = await response.json();
        console.log('Response JSON:', result);
      } catch (jsonError) {
        console.log('Failed to parse JSON response:', jsonError);
        const responseText = await response.text();
        console.log('Response Text:', responseText);
        result = { error: 'Invalid response format' };
      }
      
      if (response.ok) {
        showNotification('อนุมัติการจองสำเร็จ', 'success');
        fetchBookings();
      } else {
        const errorMessage = result.message || result.error || `HTTP ${response.status}: ${response.statusText}`;
        console.log('Error message:', errorMessage);
        showNotification(`อนุมัติไม่สำเร็จ: ${errorMessage}`, 'error');
      }
    } catch (error) {
      showNotification('เกิดข้อผิดพลาดในการอนุมัติ', 'error');
    } finally {
      setBookings(prev => prev.map(b => ({ ...b, approving: false })));
    }
  };

  // ===== ฟังก์ชันลบ booking สำหรับ admin =====
  const adminDeleteBooking = async (booking) => {
    try {
      const bookingId = booking._id || booking.id;
      setBookings(prev => prev.map(b => (b._id === bookingId ? { ...b, adminDeleting: true } : b)));
      
      const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('jwt_token');
      if (!token) {
        showNotification('กรุณาเข้าสู่ระบบใหม่', 'warning');
        return;
      }
      
      const apiUrl = `http://localhost:5001/api/admin/booking/${bookingId}`;
      
      console.log('=== ADMIN DELETE BOOKING DEBUG ===');
      console.log('Booking to delete:', booking);
      console.log('Booking ID:', bookingId);
      console.log('API URL:', apiUrl);
      console.log('Token present:', !!token);
      console.log('User role:', userRole);
      
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('Response Status:', response.status);
      console.log('Response OK:', response.ok);
      
      let result;
      try {
        result = await response.json();
        console.log('Response JSON:', result);
      } catch (jsonError) {
        console.log('Failed to parse JSON response:', jsonError);
        const responseText = await response.text();
        console.log('Response Text:', responseText);
        result = { error: 'Invalid response format' };
      }
      
      if (response.ok) {
        showNotification('ลบการจองสำเร็จ (Admin)', 'success');
        fetchBookings();
      } else {
        const errorMessage = result.message || result.error || `HTTP ${response.status}: ${response.statusText}`;
        console.log('Error message:', errorMessage);
        showNotification(`ลบไม่สำเร็จ: ${errorMessage}`, 'error');
      }
    } catch (error) {
      console.error('Error admin deleting booking:', error);
      showNotification('เกิดข้อผิดพลาดในการลบ', 'error');
    } finally {
      setBookings(prev => prev.map(b => ({ ...b, adminDeleting: false })));
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>กำลังโหลดรายการการจอง...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>รายการการจองของฉัน</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Text style={styles.refreshButtonText}>รีเฟรช</Text>
        </TouchableOpacity>
      </View>

      {/* ตรวจสอบ authentication ก่อนแสดงข้อมูล */}
      {!userToken ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>กรุณาเข้าสู่ระบบ</Text>
          <Text style={styles.emptySubText}>คุณต้องเข้าสู่ระบบก่อนดูรายการการจอง</Text>
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>ไม่มีรายการการจอง</Text>
          <Text style={styles.emptySubText}>คุณยังไม่มีการจองห้องใดๆ</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBookingItem}
          keyExtractor={(item, index) => item._id || index.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
      
      {/* Modal สำหรับแก้ไขการจอง */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>แก้ไขเวลาการจอง</Text>
            <Text style={styles.modalSubtitle}>ห้อง {selectedBooking?.room_name}</Text>
            
            <View style={styles.editSection}>
              <Text style={styles.inputLabel}>วันที่และเวลาเริ่ม</Text>
              <View style={styles.inputWithButtonRow}>
                <TextInput
                  style={[styles.editInput, { flex: 1, marginRight: 8 }]}
                  placeholder="2024-09-10 14:00"
                  value={editStartDatetime}
                  onChangeText={setEditStartDatetime}
                />
                <TouchableOpacity 
                  style={styles.quickFillButton} 
                  onPress={() => setCurrentDateTimeForEdit('start')}
                >
                  <Text style={styles.quickFillText}>ตอนนี้</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.helpText}>รูปแบบ: YYYY-MM-DD HH:MM</Text>
            </View>
            
            <View style={styles.editSection}>
              <Text style={styles.inputLabel}>วันที่และเวลาสิ้นสุด</Text>
              <View style={styles.inputWithButtonRow}>
                <TextInput
                  style={[styles.editInput, { flex: 1, marginRight: 8 }]}
                  placeholder="2024-09-10 17:00"
                  value={editEndDatetime}
                  onChangeText={setEditEndDatetime}
                />
                <TouchableOpacity 
                  style={styles.quickFillButton} 
                  onPress={() => setCurrentDateTimeForEdit('end')}
                >
                  <Text style={styles.quickFillText}>+2ชม</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.helpText}>รูปแบบ: YYYY-MM-DD HH:MM</Text>
            </View>
            
            <View style={styles.editSection}>
              <Text style={styles.inputLabel}>ระยะเวลา (ชั่วโมง)</Text>
              <TextInput
                style={styles.editInput}
                placeholder="3"
                value={editDuration}
                onChangeText={setEditDuration}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={updateBooking}
                disabled={updating}
              >
                <Text style={styles.saveButtonText}>
                  {updating ? 'กำลังบันทึก...' : '💾 บันทึกการแก้ไข'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={closeEditModal}
                disabled={updating}
              >
                <Text style={styles.cancelButtonText}>❌ ยกเลิก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Modal สำหรับยืนยันการลบ */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: 300 }]}>
            <Text style={styles.modalTitle}>ยืนยันการลบ</Text>
            <Text style={styles.modalSubtitle}>
              คุณต้องการลบการจองห้อง {bookingToDelete?.room_name} หรือไม่?
            </Text>
            
            {bookingToDelete && (
              <View style={styles.deleteInfoContainer}>
                <Text style={styles.deleteInfoText}>
                  เวลา: {formatDateTime(bookingToDelete.start_datetime?.$date || bookingToDelete.start_datetime)} - {formatDateTime(bookingToDelete.end_datetime?.$date || bookingToDelete.end_datetime)}
                </Text>
                <Text style={styles.deleteInfoText}>
                  ระยะเวลา: {bookingToDelete.duration_hours} ชั่วโมง
                </Text>
                <Text style={styles.deleteInfoText}>
                  สถานะ: {bookingToDelete.status}
                </Text>
              </View>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setBookingToDelete(null);
                }}
                disabled={deleting}
              >
                <Text style={styles.cancelButtonText}>ยกเลิก</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButtonModal]}
                onPress={() => {
                  console.log('Delete confirmed, calling confirmDeleteBooking');
                  confirmDeleteBooking(bookingToDelete);
                  setDeleteModalVisible(false);
                }}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.deleteButtonModalText}>ลบ</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Custom Notification */}
      {notification.visible && (
        <View style={[
          styles.notificationOverlay,
          notification.type === 'success' && styles.notificationSuccess,
          notification.type === 'error' && styles.notificationError,
          notification.type === 'warning' && styles.notificationWarning,
        ]}>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationIcon}>
              {notification.type === 'success' ? '✅' : 
               notification.type === 'error' ? '❌' : '⚠️'}
            </Text>
            <Text style={styles.notificationText}>{notification.message}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 15,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  roomName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    padding: 15,
  },
  fullName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    width: 60,
    fontWeight: '500',
  },
  dateTime: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  durationContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  duration: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  createdAtContainer: {
    flexDirection: 'row',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  createdAtLabel: {
    fontSize: 12,
    color: '#888',
    width: 60,
  },
  createdAt: {
    fontSize: 12,
    color: '#888',
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  // Action buttons styles
  actionButtonsContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  userActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  adminActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  editButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deleteButtonInList: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  deleteButtonInListText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#95a5a6',
    opacity: 0.7,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  editSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputWithButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  quickFillButton: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  quickFillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  helpText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  saveButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    flex: 1,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    flex: 1,
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Notification styles
  notificationOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
  notificationSuccess: {
    backgroundColor: '#27ae60',
  },
  notificationError: {
    backgroundColor: '#e74c3c',
  },
  notificationWarning: {
    backgroundColor: '#f39c12',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  notificationText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },
  deleteInfoContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
  },
  deleteInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  deleteButtonModal: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    flex: 1,
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  deleteButtonModalText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  approveButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  adminDeleteButton: {
    backgroundColor: '#dc3545', // สีแดงเข้มกว่าปุ่มลบปกติ
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  adminDeleteButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});