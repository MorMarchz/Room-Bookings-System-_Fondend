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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function BookingListScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userToken, setUserToken] = useState(null);

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

  const checkAuthentication = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('jwt_token');
      let userId = await AsyncStorage.getItem('userId') || await AsyncStorage.getItem('user_id');
      
      console.log('=== Authentication Check ===');
      console.log('Token found:', token ? 'Yes' : 'No');
      console.log('User ID found:', userId ? 'Yes' : 'No');
      
      if (!token) {
        Alert.alert(
          'กรุณาเข้าสู่ระบบ',
          'คุณต้องเข้าสู่ระบบก่อนดูรายการการจอง',
          [
            {
              text: 'ตกลง',
              onPress: () => navigation.navigate('Profile')
            }
          ]
        );
        return;
      }

      // หากไม่มี userId ให้ดึงจาก token
      if (!userId && token) {
        const decodedToken = decodeJWT(token);
        if (decodedToken && decodedToken.id) {
          userId = decodedToken.id;
          // เก็บ userId ไว้ใน AsyncStorage สำหรับครั้งต่อไป
          await AsyncStorage.setItem('userId', userId);
          console.log('Extracted User ID from token:', userId);
        }
      }

      console.log('Final User ID:', userId);
      
      if (!userId) {
        Alert.alert(
          'เกิดข้อผิดพลาด',
          'ไม่สามารถระบุตัวตนผู้ใช้ได้ กรุณาเข้าสู่ระบบใหม่',
          [
            {
              text: 'ตกลง',
              onPress: () => navigation.navigate('Profile')
            }
          ]
        );
        return;
      }
      
      setUserToken(token);
      fetchBookings();
    } catch (error) {
      console.error('Error checking authentication:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถตรวจสอบสถานะการเข้าสู่ระบบได้');
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('jwt_token');
      let userId = await AsyncStorage.getItem('userId') || await AsyncStorage.getItem('user_id');

      console.log('=== Fetching Bookings ===');
      console.log('Token:', token ? 'Present' : 'Missing');

      if (!token) {
        console.log('Missing token, aborting fetch');
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
        console.log('Missing userId, aborting fetch');
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
        console.log('401 Unauthorized - Token expired');
        Alert.alert(
          'เซสชันหมดอายุ',
          'กรุณาเข้าสู่ระบบใหม่',
          [
            {
              text: 'ตกลง',
              onPress: async () => {
                await AsyncStorage.removeItem('userToken');
                await AsyncStorage.removeItem('userId');
                navigation.navigate('Profile');
              }
            }
          ]
        );
        return;
      }

      if (!response.ok) {
        console.log('API Error - Status:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw API Data:', data);
      console.log('Data length:', data.length);
      
      // กรองเฉพาะการจองของผู้ใช้คนนี้เท่านั้น
      const userBookings = data.filter(booking => {
        console.log('Comparing booking.user_id:', booking.user_id, 'with userId:', userId);
        return booking.user_id === userId || booking.user_id?.toString() === userId?.toString();
      });
      
      console.log('Filtered User Bookings:', userBookings);
      console.log('User Bookings length:', userBookings.length);
      
      setBookings(userBookings);
      
    } catch (error) {
      console.error('Error fetching bookings:', error);
      Alert.alert(
        'เกิดข้อผิดพลาด',
        'ไม่สามารถโหลดรายการการจองได้ กรุณาลองใหม่อีกครั้ง'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
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
      case 'confirmed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'cancelled':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'ยืนยันแล้ว';
      case 'pending':
        return 'รอยืนยัน';
      case 'cancelled':
        return 'ยกเลิกแล้ว';
      default:
        return status;
    }
  };

  const renderBookingItem = ({ item }) => (
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
      </View>
    </View>
  );

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

      {bookings.length === 0 ? (
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
});