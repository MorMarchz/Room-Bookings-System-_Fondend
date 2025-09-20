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
  Platform,
  ScrollView,
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
  
  // Date picker states for edit modal
  const [editStartDate, setEditStartDate] = useState(new Date());
  const [editEndDate, setEditEndDate] = useState(new Date());
  const [showEditStartDatePicker, setShowEditStartDatePicker] = useState(false);
  const [showEditEndDatePicker, setShowEditEndDatePicker] = useState(false);
  
  // Time picker states for edit modal
  const [editStartHour, setEditStartHour] = useState('09');
  const [editStartMinute, setEditStartMinute] = useState('00');
  const [editEndHour, setEditEndHour] = useState('11');
  const [editEndMinute, setEditEndMinute] = useState('00');
  const [showEditStartHourPicker, setShowEditStartHourPicker] = useState(false);
  const [showEditStartMinutePicker, setShowEditStartMinutePicker] = useState(false);
  const [showEditEndHourPicker, setShowEditEndHourPicker] = useState(false);
  const [showEditEndMinutePicker, setShowEditEndMinutePicker] = useState(false);
  
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

  // Generate hour and minute options for edit modal
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  // Update datetime string from date and time components for edit modal
  const updateEditDateTimeString = (type) => {
    const date = type === 'start' ? editStartDate : editEndDate;
    const hour = type === 'start' ? editStartHour : editEndHour;
    const minute = type === 'start' ? editStartMinute : editEndMinute;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const dateTimeString = `${year}-${month}-${day} ${hour}:${minute}`;
    
    if (type === 'start') {
      setEditStartDatetime(dateTimeString);
      // Calculate duration immediately after setting start time
      setTimeout(() => {
        calculateEditDurationWithValues(dateTimeString, editEndDatetime);
      }, 50);
    } else {
      setEditEndDatetime(dateTimeString);
      // Calculate duration immediately after setting end time
      setTimeout(() => {
        calculateEditDurationWithValues(editStartDatetime, dateTimeString);
      }, 50);
    }
  };

  // Calculate duration with specific datetime values
  const calculateEditDurationWithValues = (startDatetimeValue, endDatetimeValue) => {
    if (startDatetimeValue && endDatetimeValue) {
      try {
        const start = new Date(startDatetimeValue);
        const end = new Date(endDatetimeValue);
        
        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
          const diffInMs = end - start;
          const diffInHours = diffInMs / (1000 * 60 * 60);
          setEditDuration(diffInHours.toString());
        }
      } catch (error) {
        console.log('Error calculating duration:', error);
      }
    }
  };

  // Calculate duration automatically for edit modal
  const calculateEditDuration = () => {
    calculateEditDurationWithValues(editStartDatetime, editEndDatetime);
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
    setBookings([]);
    setUserToken(null);
    setLoading(false);
    setRefreshing(false);
  };

  const checkAuthentication = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('jwt_token');
      let userId = await AsyncStorage.getItem('userId') || await AsyncStorage.getItem('user_id');
      

      
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

          }
          if (decodedToken.role) {
            setUserRole(decodedToken.role);

          }
        }
      }


      
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
    if (userToken && userRole) {
      fetchBookings();
    }
  }, [userToken, userRole]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('jwt_token');
      let userId = await AsyncStorage.getItem('userId') || await AsyncStorage.getItem('user_id');

      if (!token) {
        clearBookingData(); // ⚠️ ใช้ฟังก์ชัน clear แทน
        return;
      }

      // หากไม่มี userId ให้ดึงจาก token
      if (!userId && token) {
        const decodedToken = decodeJWT(token);
        if (decodedToken && decodedToken.id) {
          userId = decodedToken.id;
          await AsyncStorage.setItem('userId', userId);
        }
      }

      if (!userId) {
        clearBookingData(); // ⚠️ ใช้ฟังก์ชัน clear แทน
        return;
      }
      
      const response = await fetch('http://localhost:5001/api/bookings_list', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
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
        clearBookingData(); // ⚠️ ใช้ฟังก์ชัน clear แทน
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // ถ้า admin ให้เห็นทุก booking, ถ้าไม่ใช่ admin ให้เห็นเฉพาะของตัวเอง
      let bookingsToShow = data;
      if (userRole !== 'admin') {
        bookingsToShow = data.filter(booking => {
          return booking.user_id === userId || booking.user_id?.toString() === userId?.toString();
        });
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
    
    // Set datetime strings
    setEditStartDatetime(formatForInput(startDate));
    setEditEndDatetime(formatForInput(endDate));
    setEditDuration(booking.duration_hours?.toString() || '');
    
    // Set date objects
    setEditStartDate(startDate);
    setEditEndDate(endDate);
    
    // Set time components
    setEditStartHour(String(startDate.getHours()).padStart(2, '0'));
    setEditStartMinute(String(startDate.getMinutes()).padStart(2, '0'));
    setEditEndHour(String(endDate.getHours()).padStart(2, '0'));
    setEditEndMinute(String(endDate.getMinutes()).padStart(2, '0'));
    
    setEditModalVisible(true);
  };

  // ฟังก์ชันปิด modal แก้ไข
  const closeEditModal = () => {
    setEditModalVisible(false);
    setSelectedBooking(null);
    setEditStartDatetime('');
    setEditEndDatetime('');
    setEditDuration('');
    
    // Reset date/time picker states
    setEditStartDate(new Date());
    setEditEndDate(new Date());
    setEditStartHour('09');
    setEditStartMinute('00');
    setEditEndHour('11');
    setEditEndMinute('00');
    
    // Close all dropdowns
    setShowEditStartDatePicker(false);
    setShowEditEndDatePicker(false);
    setShowEditStartHourPicker(false);
    setShowEditStartMinutePicker(false);
    setShowEditEndHourPicker(false);
    setShowEditEndMinutePicker(false);
  };

  // ฟังก์ชันอัพเดทการจอง
  const updateBooking = async () => {
    // Debug: แสดงค่าที่จะส่งไป update
    console.log('Update values:', {
      editStartDatetime,
      editEndDatetime,
      editDuration,
      editStartDate: editStartDate.toISOString(),
      editEndDate: editEndDate.toISOString(),
      editStartHour,
      editStartMinute,
      editEndHour,
      editEndMinute
    });

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

      // ใช้ endpoint ที่ Backend รองรับ: /api/bookings_list/update/:id
      const bookingId = selectedBooking._id || selectedBooking.id;
      const apiUrl = `http://localhost:5001/api/bookings_list/update/${bookingId}`;

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

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

  // ฟังก์ชันลบการจอง
  const deleteBooking = async (booking) => {
    // เก็บข้อมูลการจองที่จะลบและแสดง modal
    setBookingToDelete(booking);
    setDeleteModalVisible(true);
  };

  // ฟังก์ชันยืนยันการลบ
  const confirmDeleteBooking = async (booking) => {
    try {
      const bookingId = booking._id || booking.id;
      
      setDeleting(bookingId); // แสดง loading สำหรับการจองนี้
      
      const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('jwt_token');
      
      if (!token) {
        showNotification('กรุณาเข้าสู่ระบบใหม่', 'warning');
        return;
      }

      const apiUrl = `http://localhost:5001/api/bookings_list/delete/${bookingId}`;

      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        result = { error: 'Invalid response format' };
      }

      if (response.ok) {
        showNotification('ลบการจองเรียบร้อยแล้ว', 'success');
        fetchBookings(); // รีเฟรชข้อมูล
      } else {
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
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });
      
      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        const responseText = await response.text();
        result = { error: 'Invalid response format' };
      }
      
      if (response.ok) {
        showNotification('อนุมัติการจองสำเร็จ', 'success');
        fetchBookings();
      } else {
        const errorMessage = result.message || result.error || `HTTP ${response.status}: ${response.statusText}`;
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
      
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        const responseText = await response.text();
        result = { error: 'Invalid response format' };
      }
      
      if (response.ok) {
        showNotification('ลบการจองสำเร็จ (Admin)', 'success');
        fetchBookings();
      } else {
        const errorMessage = result.message || result.error || `HTTP ${response.status}: ${response.statusText}`;
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
            
            <View style={styles.dateTimeSection}>
              <Text style={styles.inputLabel}>วันที่และเวลาเริ่ม</Text>
              
              {/* Date Section - Vertical Layout */}
              <View style={styles.dateSection}>
                <View style={styles.dateColumn}>
                  <Text style={styles.columnLabel}>วันที่เริ่ม</Text>
                  {Platform.OS === 'web' ? (
                    <input
                      type="date"
                      style={{
                        width: '100%',
                        padding: 12,
                        fontSize: 16,
                        border: '1px solid #ddd',
                        borderRadius: 10,
                        backgroundColor: '#fff'
                      }}
                      value={editStartDate.toISOString().split('T')[0]}
                      onChange={(e) => {
                        const newDate = new Date(e.target.value);
                        if (!isNaN(newDate.getTime())) {
                          setEditStartDate(newDate);
                          updateEditDateTimeString('start');
                        }
                      }}
                    />
                  ) : (
                    <TouchableOpacity 
                      style={[styles.input, styles.dateButton]}
                      onPress={() => setShowEditStartDatePicker(true)}
                    >
                      <Text style={styles.dateButtonText}>
                        {editStartDate.toLocaleDateString('th-TH')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.dateColumn}>
                  <Text style={styles.columnLabel}>วันที่สิ้นสุด</Text>
                  {Platform.OS === 'web' ? (
                    <input
                      type="date"
                      style={{
                        width: '100%',
                        padding: 12,
                        fontSize: 16,
                        border: '1px solid #ddd',
                        borderRadius: 10,
                        backgroundColor: '#fff'
                      }}
                      value={editEndDate.toISOString().split('T')[0]}
                      onChange={(e) => {
                        const newDate = new Date(e.target.value);
                        if (!isNaN(newDate.getTime())) {
                          setEditEndDate(newDate);
                          updateEditDateTimeString('end');
                        }
                      }}
                    />
                  ) : (
                    <TouchableOpacity 
                      style={[styles.input, styles.dateButton]}
                      onPress={() => setShowEditEndDatePicker(true)}
                    >
                      <Text style={styles.dateButtonText}>
                        {editEndDate.toLocaleDateString('th-TH')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Time Row - Start and End Time */}
              <View style={styles.timeSection}>
                <Text style={styles.sectionLabel}>เวลา</Text>
                <View style={styles.timeRow}>
                  {/* Start Time */}
                  <View style={styles.timeColumn}>
                    <Text style={styles.columnLabel}>เวลาเริ่ม</Text>
                    <View style={styles.timePickerRow}>
                      <TouchableOpacity 
                        style={styles.timePickerButton}
                        onPress={() => setShowEditStartHourPicker(!showEditStartHourPicker)}
                      >
                        <Text style={styles.timePickerText}>{editStartHour}</Text>
                        <Text style={styles.dropdownIcon}>▼</Text>
                      </TouchableOpacity>
                      <Text style={styles.timeSeparator}>:</Text>
                      <TouchableOpacity 
                        style={styles.timePickerButton}
                        onPress={() => setShowEditStartMinutePicker(!showEditStartMinutePicker)}
                      >
                        <Text style={styles.timePickerText}>{editStartMinute}</Text>
                        <Text style={styles.dropdownIcon}>▼</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* End Time */}
                  <View style={styles.timeColumn}>
                    <Text style={styles.columnLabel}>เวลาสิ้นสุด</Text>
                    <View style={styles.timePickerRow}>
                      <TouchableOpacity 
                        style={styles.timePickerButton}
                        onPress={() => setShowEditEndHourPicker(!showEditEndHourPicker)}
                      >
                        <Text style={styles.timePickerText}>{editEndHour}</Text>
                        <Text style={styles.dropdownIcon}>▼</Text>
                      </TouchableOpacity>
                      <Text style={styles.timeSeparator}>:</Text>
                      <TouchableOpacity 
                        style={styles.timePickerButton}
                        onPress={() => setShowEditEndMinutePicker(!showEditEndMinutePicker)}
                      >
                        <Text style={styles.timePickerText}>{editEndMinute}</Text>
                        <Text style={styles.dropdownIcon}>▼</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </View>
            
            <View style={styles.editSection}>
              <Text style={styles.inputLabel}>ระยะเวลา (ชั่วโมง)</Text>
              <TextInput
                style={styles.editInput}
                placeholder="3"
                value={editDuration}
                onChangeText={setEditDuration}
                keyboardType="numeric"
                editable={false}
              />
              <Text style={styles.helpText}>ระยะเวลาจะถูกคำนวณอัตโนมัติ</Text>
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

      {/* Time Picker Dropdowns for Edit Modal - Changed to Modal */}
      <Modal visible={showEditStartHourPicker} transparent animationType="fade">
        <View style={styles.dropdownModalOverlay}>
          <View style={styles.dropdownContainer}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>เลือกชั่วโมงเริ่ม</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowEditStartHourPicker(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dropdownGrid}>
              {hours.map((hour) => (
                <TouchableOpacity
                  key={hour}
                  style={[styles.dropdownItem, editStartHour === hour && styles.dropdownItemSelected]}
                  onPress={() => {
                    setEditStartHour(hour);
                    setShowEditStartHourPicker(false);
                    updateEditDateTimeString('start');
                  }}
                >
                  <Text style={[styles.dropdownItemText, editStartHour === hour && styles.dropdownItemTextSelected]}>{hour}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showEditStartMinutePicker} transparent animationType="fade">
        <View style={styles.dropdownModalOverlay}>
          <View style={styles.dropdownContainer}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>เลือกนาทีเริ่ม</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowEditStartMinutePicker(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dropdownGrid}>
              {minutes.filter((_, index) => index % 5 === 0).map((minute) => (
                <TouchableOpacity
                  key={minute}
                  style={[styles.dropdownItem, editStartMinute === minute && styles.dropdownItemSelected]}
                  onPress={() => {
                    setEditStartMinute(minute);
                    setShowEditStartMinutePicker(false);
                    updateEditDateTimeString('start');
                  }}
                >
                  <Text style={[styles.dropdownItemText, editStartMinute === minute && styles.dropdownItemTextSelected]}>{minute}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showEditEndHourPicker} transparent animationType="fade">
        <View style={styles.dropdownModalOverlay}>
          <View style={styles.dropdownContainer}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>เลือกชั่วโมงสิ้นสุด</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowEditEndHourPicker(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dropdownGrid}>
              {hours.map((hour) => (
                <TouchableOpacity
                  key={hour}
                  style={[styles.dropdownItem, editEndHour === hour && styles.dropdownItemSelected]}
                  onPress={() => {
                    setEditEndHour(hour);
                    setShowEditEndHourPicker(false);
                    updateEditDateTimeString('end');
                  }}
                >
                  <Text style={[styles.dropdownItemText, editEndHour === hour && styles.dropdownItemTextSelected]}>{hour}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showEditEndMinutePicker} transparent animationType="fade">
        <View style={styles.dropdownModalOverlay}>
          <View style={styles.dropdownContainer}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>เลือกนาทีสิ้นสุด</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowEditEndMinutePicker(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dropdownGrid}>
              {minutes.filter((_, index) => index % 5 === 0).map((minute) => (
                <TouchableOpacity
                  key={minute}
                  style={[styles.dropdownItem, editEndMinute === minute && styles.dropdownItemSelected]}
                  onPress={() => {
                    setEditEndMinute(minute);
                    setShowEditEndMinutePicker(false);
                    updateEditDateTimeString('end');
                  }}
                >
                  <Text style={[styles.dropdownItemText, editEndMinute === minute && styles.dropdownItemTextSelected]}>{minute}</Text>
                </TouchableOpacity>
              ))}
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
    width: 320,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
  // Date/Time Picker Styles
  dateTimeSection: {
    marginVertical: 15,
  },
  dateSection: {
    flexDirection: 'column',
    marginBottom: 15,
    gap: 15,
  },
  dateColumn: {
    flex: 1,
  },
  columnLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  dateButton: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  timeSection: {
    marginTop: 10,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  timeColumn: {
    flex: 1,
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    minWidth: 60,
  },
  timePickerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginRight: 8,
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#666',
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginHorizontal: 10,
  },
  // Dropdown Styles
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
    elevation: 20,
  },
  dropdownModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    maxHeight: '80%',
    width: '85%',
    padding: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 25,
    zIndex: 100000,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  dropdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    justifyContent: 'space-between',
  },
  dropdownItem: {
    width: '15%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  dropdownItemSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
  },
  dropdownItemTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});