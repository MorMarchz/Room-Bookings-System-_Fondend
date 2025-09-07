import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, Modal, TextInput, Alert, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RoomsScreen() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetch('http://localhost:5001/api/rooms')
      .then((res) => res.json())
      .then((data) => {
        console.log('Rooms data received:', data); // Debug log
        console.log('First room structure:', data[0]); // Debug log
        setRooms(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching rooms:', error);
        setLoading(false);
      });
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
    let typeOk = typeFilter === 'all' || room.type === typeFilter;
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
    
    console.log('AsyncStorage check:');
    console.log('Token:', token ? 'Found' : 'Not found');
    console.log('Selected Room:', selectedRoom);
    
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
        room_id: selectedRoom._id || selectedRoom.id, // Backend ต้องการ room_id ไม่ใช่ room_name
      };

      // ไม่ต้องส่ง user_id, fullname, room_name เพราะ Backend จะดึงเองจาก token และ room_id

      console.log('Sending booking data:', bookingData); // Debug log
      console.log('Token:', token ? 'Present' : 'Missing'); // Debug log
      console.log('Room ID:', selectedRoom._id || selectedRoom.id); // Debug log
      console.log('Room Name:', selectedRoom.room_name); // Debug log

      const res = await fetch('http://localhost:5001/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });
      
      const data = await res.json();
      console.log('Response Status:', res.status); // Debug log
      console.log('Response Data:', data); // Debug log
      
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
        console.error('Booking error:', data);
      }
    } catch (e) {
      console.error('Network error:', e);
      Alert.alert('เกิดข้อผิดพลาด', `ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์: ${e.message}`);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1532/1532788.png' }}
        style={styles.image}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.room_name} ({item.building})</Text>
        <Text>ประเภท: {item.type}</Text>
        <Text>ความจุ: {item.capacity} คน</Text>
        <Text>สิ่งอำนวยความสะดวก: {item.facilities.join(', ')}</Text>
        <Text>สถานะ: {item.status === 'available' ? 'ว่าง' : 'ไม่ว่าง'}</Text>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => {
            setSelectedRoom(item);
            setBookingVisible(true);
          }}
          disabled={item.status !== 'available'}
        >
          <Text style={{ color: '#fff' }}>
            {item.status === 'available' ? 'จองห้อง' : 'ไม่สามารถจองได้'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>กำลังโหลด...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
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
                <Text>ทั้งหมด</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterOption, statusFilter === 'available' && styles.selected]}
                onPress={() => setStatusFilter('available')}
              >
                <Text>ว่าง</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterOption, statusFilter === 'unavailable' && styles.selected]}
                onPress={() => setStatusFilter('unavailable')}
              >
                <Text>ไม่ว่าง</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.filterLabel}>ประเภทห้อง</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.filterOption, typeFilter === 'all' && styles.selected]}
                onPress={() => setTypeFilter('all')}
              >
                <Text>ทั้งหมด</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterOption, typeFilter === 'lab' && styles.selected]}
                onPress={() => setTypeFilter('lab')}
              >
                <Text>Lab</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterOption, typeFilter === 'classroom' && styles.selected]}
                onPress={() => setTypeFilter('classroom')}
              >
                <Text>Classroom</Text>
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
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  image: {
    width: 64,
    height: 64,
    marginRight: 16,
    borderRadius: 8,
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
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  filterOption: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbb',
    marginHorizontal: 4,
    backgroundColor: '#f1f2f6',
  },
  selected: {
    backgroundColor: '#2d98da',
    borderColor: '#2d98da',
    color: '#fff',
  },
  filterApply: {
    flex: 1,
    backgroundColor: '#2d98da',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  bookButton: {
    marginTop: 10,
    backgroundColor: '#27ae60',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    opacity: 1,
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