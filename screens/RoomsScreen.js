import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, Modal, TextInput, Alert, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function RoomsScreen() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // เพิ่ม state สำหรับตรวจสอบ login

  // filter state
  const [filterVisible, setFilterVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // booking modal state
  const [bookingVisible, setBookingVisible] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [startDatetime, setStartDatetime] = useState('');
  const [endDatetime, setEndDatetime] = useState('');
  const [duration, setDuration] = useState('');

  // success notification state
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));

  // ตรวจสอบสถานะการ login
  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('jwt_token');
      setIsLoggedIn(!!token);
      console.log('Login status:', !!token);
    } catch (error) {
      console.error('Error checking login status:', error);
      setIsLoggedIn(false);
    }
  };

  // ตรวจสอบสถานะการ login ทุกครั้งที่หน้านี้ได้รับ focus
  useFocusEffect(
    React.useCallback(() => {
      checkLoginStatus();
    }, [])
  );

  useEffect(() => {
    // ใช้ข้อมูลจาก Backend API
    fetch('http://localhost:5001/api/rooms')
      .then((res) => res.json())
      .then((data) => {
        console.log('Rooms data received:', data);
        setRooms(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching rooms:', error);
        setLoading(false);
      });

    // ข้อมูลห้องจำลอง - แต่ละห้องจะมีรูปภาพไม่เหมือนกัน (สำหรับ fallback)
    /*
    const mockRoomsData = [
      {
        "id": "1",
        "room_name": "4311",
        "building": "ตึก 4",
        "capacity": 50,
        "type": "lab",
        "facilities": [
          "projector",
          "whiteboard",
          "aircon"
        ],
        "status": "available",
        "image": "https://images.unsplash.com/photo-1562774053-701939374585?w=800&h=600&fit=crop&crop=center" // Computer Lab
      },
      {
        "id": "2",
        "room_name": "7203",
        "building": "ตึก 7",
        "capacity": 30,
        "type": "classroom",
        "facilities": [
          "projector",
          "whiteboard",
          "aircon"
        ],
        "status": "available",
        "image": "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&h=600&fit=crop&crop=center" // Classroom
      },
      {
        "id": "3",
        "room_name": "4205",
        "building": "ตึก 4",
        "capacity": 20,
        "type": "meeting",
        "facilities": [
          "projector",
          "aircon"
        ],
        "status": "available",
        "image": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop&crop=center" // Meeting Room
      },
      {
        "id": "4",
        "room_name": "3305",
        "building": "ตึก 3",
        "capacity": 35,
        "type": "lab",
        "facilities": [
          "projector",
          "whiteboard",
          "aircon"
        ],
        "status": "available",
        "image": "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&h=600&fit=crop&crop=center" // Science Lab
      }
    ];

    // จำลองการ delay ของ API call
    setTimeout(() => {
      console.log('Rooms data loaded:', mockRoomsData);
      setRooms(mockRoomsData);
      setLoading(false);
    }, 500);
    */
  }, []);

  // ฟังก์ชันแสดง success notification
  const showSuccessNotification = (message) => {
    setSuccessMessage(message);
    setSuccessVisible(true);
    
    // Animation fade in
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2500), // แสดงผล 2.5 วินาที
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSuccessVisible(false);
    });
  };

  // ฟังก์ชันสำหรับเติมเวลาปัจจุบัน
  const setCurrentDateTime = (type) => {
    const now = new Date();
    if (type === 'start') {
      // กำหนดเวลาปัจจุบัน
      const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setStartDatetime(formatted);
    } else {
      // กำหนดเวลา 2 ชั่วโมงหลังจากนี้
      now.setHours(now.getHours() + 2);
      const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setEndDatetime(formatted);
      setDuration('2');
    }
  };

  // ฟิลเตอร์ข้อมูล
  const filteredRooms = rooms.filter((room) => {
    let statusOk = statusFilter === 'all' || room.status === statusFilter;
    let typeOk = typeFilter === 'all' || room.type?.toLowerCase() === typeFilter.toLowerCase();
    return statusOk && typeOk;
  });

  // ฟังก์ชันจองห้อง
  const handleBookRoom = async () => {
    if (!startDatetime || !endDatetime || !duration) {
      Alert.alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }

    // ตรวจสอบ token และ user data
    const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('jwt_token');
    
    if (!token) {
      Alert.alert('กรุณาเข้าสู่ระบบก่อนจองห้อง');
      setBookingVisible(false);
      return;
    }

    // ตรวจสอบว่าห้องมี ID หรือไม่
    if (!selectedRoom || (!selectedRoom._id && !selectedRoom.id)) {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่พบข้อมูลห้องที่เลือก กรุณาลองใหม่');
      return;
    }

    // จัดการ MongoDB ObjectId
    let roomId;
    if (selectedRoom._id) {
      // กรณีที่ _id เป็น object ของ MongoDB
      roomId = selectedRoom._id.$oid || selectedRoom._id;
    } else {
      // กรณีที่ใช้ id ธรรมดา
      roomId = selectedRoom.id;
    }

    try {
      // แปลงวันที่ให้เป็นรูปแบบ ISO string
      const startDate = new Date(startDatetime);
      const endDate = new Date(endDatetime);
      
      // ตรวจสอบความถูกต้องของวันที่
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        Alert.alert('รูปแบบวันที่ไม่ถูกต้อง', 'กรุณากรอกวันที่ในรูปแบบ YYYY-MM-DD HH:MM');
        return;
      }

      if (startDate >= endDate) {
        Alert.alert('วันที่ไม่ถูกต้อง', 'เวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด');
        return;
      }

      // คำนวณระยะเวลาจริง
      const actualDuration = Math.ceil((endDate - startDate) / (1000 * 60 * 60));
      
      // เตรียมข้อมูลที่จะส่ง (ตาม Backend schema)
      const bookingData = {
        start_datetime: startDate.toISOString(),
        end_datetime: endDate.toISOString(),
        duration_hours: Number(duration) || actualDuration,
        status: 'pending',
        room_id: roomId, // ใช้ roomId ที่จัดการแล้ว
      };

      // ไม่ต้องส่ง user_id, fullname, room_name เพราะ Backend จะดึงเองจาก token และ room_id

      const res = await fetch('http://localhost:5001/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // ใช้ custom notification แทน Alert
        showSuccessNotification(`จองห้อง ${selectedRoom.room_name} เรียบร้อยแล้ว! ✅`);
        setBookingVisible(false);
        setStartDatetime('');
        setEndDatetime('');
        setDuration('');
      } else {
        // แสดงข้อผิดพลาดแบบละเอียด
        const errorMessage = data.message || data.error || `HTTP ${res.status}: ${res.statusText}`;
        Alert.alert('จองห้องไม่สำเร็จ', errorMessage);
      }
    } catch (e) {
      Alert.alert('เกิดข้อผิดพลาด', `ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์: ${e.message}`);
    }
  };

  const renderItem = ({ item }) => {
    // ตรวจสอบเงื่อนไขการแสดงปุ่ม
    const isRoomAvailable = item.status === 'available';
    const canBook = isLoggedIn && isRoomAvailable;
    
    // กำหนดสไตล์ปุ่ม
    const buttonStyle = [
      styles.bookButton,
      !canBook && styles.bookButtonDisabled
    ];
    
    // กำหนดรูปภาพตามประเภทห้อง
    const getImageForRoom = (room) => {
      if (room.image) return room.image;
      
      // กำหนดรูปภาพเริ่มต้นตามประเภท
      switch (room.type?.toLowerCase()) {
        case 'lab':
          return 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&h=600&fit=crop&crop=center';
        case 'classroom':
          return 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&h=600&fit=crop&crop=center';
        case 'meeting':
          return 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop&crop=center';
        default:
          return 'https://cdn-icons-png.flaticon.com/512/1532/1532788.png';
      }
    };
    
    // กำหนดข้อความปุ่ม
    let buttonText = '';
    if (!isLoggedIn) {
      buttonText = 'กรุณาเข้าสู่ระบบ';
    } else if (!isRoomAvailable) {
      buttonText = 'ไม่สามารถจองได้';
    } else {
      buttonText = 'จองห้อง';
    }

    return (
      <View style={styles.card}>
        <Image
          source={{ uri: getImageForRoom(item) }}
          style={styles.image}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{item.room_name} ({item.building})</Text>
          <Text>ประเภท: {item.type}</Text>
          <Text>ความจุ: {item.capacity} คน</Text>
          <Text>สิ่งอำนวยความสะดวก: {item.facilities.join(', ')}</Text>
          <Text>สถานะ: {item.status === 'available' ? 'ว่าง' : 'ไม่ว่าง'}</Text>
          
          <TouchableOpacity
            style={buttonStyle}
            onPress={() => {
              if (!isLoggedIn) {
                Alert.alert(
                  'กรุณาเข้าสู่ระบบ',
                  'คุณต้องเข้าสู่ระบบก่อนจองห้อง',
                  [
                    {
                      text: 'ตกลง',
                      onPress: () => {/* นำไปหน้า login หรือ profile */}
                    }
                  ]
                );
                return;
              }
              
              setSelectedRoom(item);
              setBookingVisible(true);
            }}
            disabled={!canBook}
          >
            <Text style={[
              styles.bookButtonText,
              !canBook && styles.bookButtonTextDisabled
            ]}>
              {buttonText}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>กำลังโหลด...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {/* แถบแสดงสถานะการ login */}
      <View style={[
        styles.loginStatusBar,
        isLoggedIn ? styles.loginStatusBarSuccess : styles.loginStatusBarWarning
      ]}>
        <Text style={styles.loginStatusText}>
          {isLoggedIn ? '✅ เข้าสู่ระบบแล้ว - สามารถจองห้องได้' : '⚠️ ยังไม่ได้เข้าสู่ระบบ - กรุณาเข้าสู่ระบบเพื่อจองห้อง'}
        </Text>
      </View>

      {/* ปุ่ม Filter */}
      <TouchableOpacity style={styles.filterButton} onPress={() => setFilterVisible(true)}>
        <Text style={styles.filterButtonText}>Filter</Text>
      </TouchableOpacity>

      {/* Modal Filter */}
      <Modal visible={filterVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>ตัวกรอง</Text>
            <Text style={styles.filterLabel}>สถานะห้อง</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.filterOption, statusFilter === 'all' && styles.selected]}
                onPress={() => setStatusFilter('all')}
              >
                <Text style={[statusFilter === 'all' && { color: '#fff', fontWeight: 'bold' }]}>ทั้งหมด</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterOption, statusFilter === 'available' && styles.selected]}
                onPress={() => setStatusFilter('available')}
              >
                <Text style={[statusFilter === 'available' && { color: '#fff', fontWeight: 'bold' }]}>ว่าง</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterOption, statusFilter === 'unavailable' && styles.selected]}
                onPress={() => setStatusFilter('unavailable')}
              >
                <Text style={[statusFilter === 'unavailable' && { color: '#fff', fontWeight: 'bold' }]}>ไม่ว่าง</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.filterLabel}>ประเภทห้อง</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.filterOption, typeFilter === 'all' && styles.selected]}
                onPress={() => setTypeFilter('all')}
              >
                <Text style={[typeFilter === 'all' && { color: '#fff', fontWeight: 'bold' }]}>ทั้งหมด</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterOption, typeFilter === 'lab' && styles.selected]}
                onPress={() => setTypeFilter('lab')}
              >
                <Text style={[typeFilter === 'lab' && { color: '#fff', fontWeight: 'bold' }]}>Lab</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterOption, typeFilter === 'classroom' && styles.selected]}
                onPress={() => setTypeFilter('classroom')}
              >
                <Text style={[typeFilter === 'classroom' && { color: '#fff', fontWeight: 'bold' }]}>Classroom</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.filterOption, typeFilter === 'meeting' && styles.selected]}
                onPress={() => setTypeFilter('meeting')}
              >
                <Text style={[typeFilter === 'meeting' && { color: '#fff', fontWeight: 'bold' }]}>Meeting</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.filterApply]}
                onPress={() => setFilterVisible(false)}
              >
                <Text style={{ color: '#fff' }}>ตกลง</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Booking */}
      <Modal visible={bookingVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>จองห้อง {selectedRoom?.room_name}</Text>
            
            <View style={styles.dateTimeSection}>
              <Text style={styles.inputLabel}>วันที่และเวลาเริ่ม</Text>
              <View style={styles.dateTimeRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 8 }]}
                  placeholder="2024-09-10 14:00"
                  value={startDatetime}
                  onChangeText={setStartDatetime}
                />
                <TouchableOpacity 
                  style={styles.quickFillButton} 
                  onPress={() => setCurrentDateTime('start')}
                >
                  <Text style={styles.quickFillText}>ตอนนี้</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.helpText}>รูปแบบ: YYYY-MM-DD HH:MM</Text>
            </View>
            
            <View style={styles.dateTimeSection}>
              <Text style={styles.inputLabel}>วันที่และเวลาสิ้นสุด</Text>
              <View style={styles.dateTimeRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 8 }]}
                  placeholder="2024-09-10 17:00"
                  value={endDatetime}
                  onChangeText={setEndDatetime}
                />
                <TouchableOpacity 
                  style={styles.quickFillButton} 
                  onPress={() => setCurrentDateTime('end')}
                >
                  <Text style={styles.quickFillText}>+2ชม</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.helpText}>รูปแบบ: YYYY-MM-DD HH:MM</Text>
            </View>
            
            <Text style={styles.inputLabel}>ระยะเวลา (ชั่วโมง)</Text>
            <TextInput
              style={styles.input}
              placeholder="3"
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
            />
            
            <View style={styles.row}>
              <TouchableOpacity style={styles.filterApply} onPress={handleBookRoom}>
                <Text style={{ color: '#fff' }}>ยืนยันจอง</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterOption, { flex: 1, alignItems: 'center' }]}
                onPress={() => {
                  setBookingVisible(false);
                  setStartDatetime('');
                  setEndDatetime('');
                  setDuration('');
                }}
              >
                <Text>ยกเลิก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Notification */}
      {successVisible && (
        <Animated.View style={[styles.successNotification, { opacity: fadeAnim }]}>
          <Text style={styles.successText}>{successMessage}</Text>
        </Animated.View>
      )}

      <FlatList
        data={filteredRooms}
        keyExtractor={(item, idx) => item.room_name + idx}
        renderItem={renderItem}
        ListEmptyComponent={<Text>ไม่พบข้อมูลห้อง</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 8,
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    alignItems: 'center',
  },
  image: {
    width: 80,
    height: 80,
    marginRight: 16,
    borderRadius: 12,
    backgroundColor: '#eee',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButton: {
    backgroundColor: '#2d98da',
    padding: 10,
    borderRadius: 8,
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  filterButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalBg: {
    flex: 1,
    backgroundColor: '#0008',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: 320,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  filterLabel: {
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    flexWrap: 'wrap',
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 6,
    marginVertical: 4,
    backgroundColor: '#f8f9fa',
    minWidth: 80,
    alignItems: 'center',
  },
  selected: {
    backgroundColor: '#2d98da',
    borderColor: '#2d98da',
  },
  filterApply: {
    backgroundColor: '#27ae60',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    elevation: 2,
  },
  bookButton: {
    marginTop: 10,
    backgroundColor: '#27ae60',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    opacity: 1,
  },
  bookButtonDisabled: {
    backgroundColor: '#95a5a6', // สีเทา
    opacity: 0.7,
  },
  bookButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  bookButtonTextDisabled: {
    color: '#ecf0f1', // ข้อความสีเทาอ่อน
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    fontSize: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    marginTop: 10,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  dateTimeSection: {
    marginBottom: 5,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickFillButton: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  quickFillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Login Status Bar Styles
  loginStatusBar: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  loginStatusBarSuccess: {
    backgroundColor: '#d5f4e6',
    borderColor: '#27ae60',
    borderWidth: 1,
  },
  loginStatusBarWarning: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffc107',
    borderWidth: 1,
  },
  loginStatusText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
  },
  // Success Notification Styles
  successNotification: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: '#2ecc71',
    padding: 16,
    borderRadius: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
    alignItems: 'center',
  },
  successText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});