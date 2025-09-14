import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, Modal, TextInput, Alert, Animated, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

// Import DateTimePicker conditionally (not supported on web)
let DateTimePicker = null;
if (Platform.OS !== 'web') {
  try {
    DateTimePicker = require('@react-native-community/datetimepicker').default;
  } catch (e) {
    console.log('DateTimePicker not available');
  }
}

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

  // DateTimePicker state
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Time picker states
  const [startHour, setStartHour] = useState('09');
  const [startMinute, setStartMinute] = useState('00');
  const [endHour, setEndHour] = useState('11');
  const [endMinute, setEndMinute] = useState('00');
  const [showStartHourPicker, setShowStartHourPicker] = useState(false);
  const [showStartMinutePicker, setShowStartMinutePicker] = useState(false);
  const [showEndHourPicker, setShowEndHourPicker] = useState(false);
  const [showEndMinutePicker, setShowEndMinutePicker] = useState(false);

  // Generate hour and minute options
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  // Update datetime string from date and time components
  const updateDateTimeString = (type) => {
    const date = type === 'start' ? startDate : endDate;
    const hour = type === 'start' ? startHour : endHour;
    const minute = type === 'start' ? startMinute : endMinute;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const dateTimeString = `${year}-${month}-${day} ${hour}:${minute}`;
    
    if (type === 'start') {
      setStartDatetime(dateTimeString);
    } else {
      setEndDatetime(dateTimeString);
    }
    
    // Auto calculate duration when both times are set - use setTimeout to ensure state is updated
    setTimeout(() => {
      calculateDuration();
    }, 100);
  };

  // Calculate duration automatically
  const calculateDuration = () => {
    try {
      // Parse hours and minutes as integers
      const startHourInt = parseInt(startHour, 10);
      const startMinuteInt = parseInt(startMinute, 10);
      const endHourInt = parseInt(endHour, 10);
      const endMinuteInt = parseInt(endMinute, 10);
      
      // Convert everything to minutes for easier calculation
      const startTotalMinutes = startHourInt * 60 + startMinuteInt;
      const endTotalMinutes = endHourInt * 60 + endMinuteInt;
      
      console.log('Start time:', startHour + ':' + startMinute, '=', startTotalMinutes, 'minutes');
      console.log('End time:', endHour + ':' + endMinute, '=', endTotalMinutes, 'minutes');
      
      // Handle case where end time is next day
      let diffMinutes;
      if (endTotalMinutes >= startTotalMinutes) {
        diffMinutes = endTotalMinutes - startTotalMinutes;
      } else {
        // End time is next day
        diffMinutes = (24 * 60) - startTotalMinutes + endTotalMinutes;
      }
      
      // Convert minutes back to hours
      const diffHours = diffMinutes / 60;
      
      console.log('Difference in minutes:', diffMinutes);
      console.log('Difference in hours:', diffHours);
      
      // Round to 1 decimal place
      const roundedHours = Math.round(diffHours * 10) / 10;
      
      console.log('Final duration:', roundedHours, 'hours');
      setDuration(roundedHours.toString());
      
    } catch (error) {
      console.log('Error calculating duration:', error);
      setDuration('0');
    }
  };

  // success notification state
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));

  // Auto-calculate duration when time values change
  useEffect(() => {
    calculateDuration();
  }, [startHour, startMinute, endHour, endMinute]);

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

  // ฟังก์ชันสำหรับแปลง Date เป็น string
  const formatDateTime = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // ฟังก์ชันสำหรับจัดการ DateTimePicker
  const onStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      setStartDatetime(formatDateTime(selectedDate));
    }
  };

  const onStartTimeChange = (event, selectedTime) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      const newDateTime = new Date(startDate);
      newDateTime.setHours(selectedTime.getHours());
      newDateTime.setMinutes(selectedTime.getMinutes());
      setStartDate(newDateTime);
      setStartDatetime(formatDateTime(newDateTime));
    }
  };

  const onEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
      setEndDatetime(formatDateTime(selectedDate));
    }
  };

  const onEndTimeChange = (event, selectedTime) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      const newDateTime = new Date(endDate);
      newDateTime.setHours(selectedTime.getHours());
      newDateTime.setMinutes(selectedTime.getMinutes());
      setEndDate(newDateTime);
      setEndDatetime(formatDateTime(newDateTime));
    }
  };

  // ฟังก์ชันสำหรับเติมเวลาปัจจุบัน
  const setCurrentDateTime = (type) => {
    const now = new Date();
    if (type === 'start') {
      setStartDate(now);
      setStartDatetime(formatDateTime(now));
    } else {
      // กำหนดเวลา 2 ชั่วโมงหลังจากนี้
      now.setHours(now.getHours() + 2);
      setEndDate(now);
      setEndDatetime(formatDateTime(now));
      setDuration('2');
    }
  };

  // ฟังก์ชันสำหรับตั้งเวลาล่วงหน้า
  const setFutureDateTime = (days, type) => {
    const future = new Date();
    future.setDate(future.getDate() + days);
    if (type === 'start') {
      setStartDate(future);
      setStartDatetime(formatDateTime(future));
    } else {
      future.setHours(future.getHours() + 2);
      setEndDate(future);
      setEndDatetime(formatDateTime(future));
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

    // กำหนดรูปภาพห้องตามประเภทและชื่อห้อง
    const getRoomImage = (type, roomName) => {
      // ตรวจสอบชื่อห้องพิเศษก่อน
      const nameCheck = roomName?.toLowerCase() || '';
      
      if (nameCheck.includes('music') || nameCheck.includes('ดนตรี')) {
        if (nameCheck.includes('1') || nameCheck.includes('a')) {
          return require('../assets/rooms/music-room-1.jpg');
        } else if (nameCheck.includes('2') || nameCheck.includes('b')) {
          return require('../assets/rooms/music-room-2.jpg');
        }
        return require('../assets/rooms/music-room.jpg');
      }
      
      if (nameCheck.includes('art') || nameCheck.includes('ศิลปะ')) {
        if (nameCheck.includes('1') || nameCheck.includes('a')) {
          return require('../assets/rooms/art-room-1.jpg');
        } else if (nameCheck.includes('2') || nameCheck.includes('b')) {
          return require('../assets/rooms/art-room-2.jpg');
        }
        return require('../assets/rooms/art-room.jpg');
      }

      if (nameCheck.includes('science') || nameCheck.includes('วิทยาศาสตร์')) {
        return require('../assets/rooms/science-room.jpg');
      }

      if (nameCheck.includes('gym') || nameCheck.includes('ออกกำลัง')) {
        return require('../assets/rooms/gym-room.jpg');
      }

      if (nameCheck.includes('studio') || nameCheck.includes('สตูดิโอ')) {
        return require('../assets/rooms/studio-room.jpg');
      }

      if (nameCheck.includes('theater') || nameCheck.includes('โรงละคร')) {
        return require('../assets/rooms/theater-room.jpg');
      }

      // ใช้ประเภทห้องเป็นหลัก แต่แยกตามชื่อห้อง
      switch (type?.toLowerCase()) {
        case 'lab':
          // สำหรับห้อง lab หลายห้อง
          if (nameCheck.includes('1') || nameCheck.includes('a') || nameCheck.includes('biology') || nameCheck.includes('ชีววิทยา')) {
            return require('../assets/rooms/lab-room-1.jpg');
          } else if (nameCheck.includes('2') || nameCheck.includes('b') || nameCheck.includes('chemistry') || nameCheck.includes('เคมี')) {
            return require('../assets/rooms/lab-room-2.jpg');
          } else if (nameCheck.includes('3') || nameCheck.includes('c') || nameCheck.includes('physics') || nameCheck.includes('ฟิสิกส์')) {
            return require('../assets/rooms/lab-room-3.jpg');
          } else if (nameCheck.includes('computer') || nameCheck.includes('คอมพิวเตอร์')) {
            return require('../assets/rooms/computer-lab.jpg');
          }
          return require('../assets/rooms/lab-room.jpg');
          
        case 'classroom':
          // สำหรับห้องเรียนหลายห้อง
          if (nameCheck.includes('1') || nameCheck.includes('a')) {
            return require('../assets/rooms/classroom-1.jpg');
          } else if (nameCheck.includes('2') || nameCheck.includes('b')) {
            return require('../assets/rooms/classroom-2.jpg');
          } else if (nameCheck.includes('3') || nameCheck.includes('c')) {
            return require('../assets/rooms/classroom-3.jpg');
          }
          return require('../assets/rooms/classroom.jpg');
          
        case 'meeting':
          if (nameCheck.includes('small') || nameCheck.includes('เล็ก') || nameCheck.includes('1')) {
            return require('../assets/rooms/meeting-room-small.jpg');
          } else if (nameCheck.includes('large') || nameCheck.includes('ใหญ่') || nameCheck.includes('2')) {
            return require('../assets/rooms/meeting-room-large.jpg');
          }
          return require('../assets/rooms/meeting-room.jpg');
          
        case 'conference':
          return require('../assets/rooms/conference-room.jpg');
        case 'seminar':
          return require('../assets/rooms/seminar-room.jpg');
        case 'workshop':
          return require('../assets/rooms/workshop-room.jpg');
        case 'computer':
          return require('../assets/rooms/computer-lab.jpg');
        case 'library':
          return require('../assets/rooms/library-room.jpg');
        case 'auditorium':
          return require('../assets/rooms/auditorium-room.jpg');
        case 'training':
          return require('../assets/rooms/training-room.jpg');
        default:
          return require('../assets/rooms/default-room.jpg');
      }
    };

    // กำหนดไอคอนห้องตามประเภท (สำหรับโอเวอร์เลย์)
    const getRoomIcon = (type, roomName) => {
      const nameCheck = roomName?.toLowerCase() || '';
      
      if (nameCheck.includes('music') || nameCheck.includes('ดนตรี')) return '🎵';
      if (nameCheck.includes('art') || nameCheck.includes('ศิลปะ')) return '🎨';
      if (nameCheck.includes('science') || nameCheck.includes('วิทยาศาสตร์')) return '🧪';
      if (nameCheck.includes('gym') || nameCheck.includes('ออกกำลัง')) return '🏃‍♂️';
      if (nameCheck.includes('kitchen') || nameCheck.includes('ครัว')) return '👨‍🍳';
      if (nameCheck.includes('studio') || nameCheck.includes('สตูดิโอ')) return '🎬';
      if (nameCheck.includes('theater') || nameCheck.includes('โรงละคร')) return '🎭';
      if (nameCheck.includes('dance') || nameCheck.includes('เต้น')) return '💃';

      switch (type?.toLowerCase()) {
        case 'lab': return '🔬';
        case 'classroom': return '📚';
        case 'meeting': return '💼';
        case 'conference': return '👥';
        case 'seminar': return '🎓';
        case 'workshop': return '🔧';
        case 'computer': return '💻';
        case 'library': return '📖';
        case 'auditorium': return '🎭';
        case 'training': return '📝';
        default: return '🏢';
      }
    };

    const getRoomGradient = (type, roomName) => {
      // สร้างสีตามชื่อห้องและประเภทเพื่อให้แต่ละห้องมีสีที่แตกต่างกัน
      const colors = [
        ['#667eea', '#764ba2'], // Purple-Blue
        ['#f093fb', '#f5576c'], // Pink-Red
        ['#4facfe', '#00f2fe'], // Blue-Cyan
        ['#43e97b', '#38f9d7'], // Green-Mint
        ['#fa709a', '#fee140'], // Pink-Yellow
        ['#a8edea', '#fed6e3'], // Mint-Pink
        ['#ff9a9e', '#fecfef'], // Coral-Pink
        ['#96e6a1', '#d4fc79'], // Green-Lime
        ['#89f7fe', '#66a6ff'], // Cyan-Blue
        ['#fdbb2d', '#22c1c3'], // Yellow-Teal
        ['#ee9ca7', '#ffdde1'], // Rose-Light Pink
        ['#30cfd0', '#91a7ff'], // Teal-Purple
        ['#ff6b6b', '#ffa726'], // Red-Orange
        ['#4ecdc4', '#44a08d'], // Teal-Green
        ['#845ec2', '#b39bc8'], // Purple-Lavender
        ['#f8b500', '#ffd54f'], // Orange-Yellow
      ];

      // ใช้ชื่อห้องและประเภทในการเลือกสี
      const hash = (roomName + type).split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      
      return colors[Math.abs(hash) % colors.length];
    };

    // เพิ่มลูกเล่นพิเศษให้แต่ละห้อง
    const getRoomPattern = (roomName) => {
      const patterns = ['circle', 'square', 'triangle', 'diamond'];
      const hash = roomName.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      return patterns[Math.abs(hash) % patterns.length];
    };

    return (
      <TouchableOpacity 
        style={styles.roomCard}
        activeOpacity={0.9}
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
          
          if (!isRoomAvailable) {
            Alert.alert('ห้องไม่ว่าง', 'ขณะนี้ห้องนี้ไม่สามารถจองได้');
            return;
          }
          
          setSelectedRoom(item);
          setBookingVisible(true);
        }}
      >
        {/* Room Image */}
        <View style={styles.roomImageContainer}>
          <Image 
            source={getRoomImage(item.type, item.room_name)}
            style={styles.roomImage}
            resizeMode="cover"
          />
        </View>
        
        {/* Room Content */}
        <View style={styles.roomContent}>
          <Text style={styles.roomName}>{item.room_name}</Text>
          <Text style={styles.roomBuilding}>{item.building}</Text>
          
          {/* Room Features */}
          <View style={styles.roomFeatures}>
            <View style={styles.featureTag}>
              <Text style={styles.featureText}>{item.type}</Text>
            </View>
            <View style={styles.featureTag}>
              <Text style={styles.featureText}>{item.capacity} คน</Text>
            </View>
            <View style={[styles.featureTag, styles.statusTag, 
              item.status === 'available' ? styles.availableTag : styles.unavailableTag
            ]}>
              <Text style={[styles.featureText, 
                item.status === 'available' ? styles.availableText : styles.unavailableText
              ]}>
                {item.status === 'available' ? 'ว่าง' : 'ไม่ว่าง'}
              </Text>
            </View>
          </View>
          
          {/* Facilities */}
          {item.facilities && item.facilities.length > 0 && (
            <View style={styles.facilitiesContainer}>
              <Text style={styles.facilitiesLabel}>สิ่งอำนวยความสะดวก:</Text>
              <View style={styles.facilitiesWrap}>
                {item.facilities.slice(0, 3).map((facility, index) => (
                  <View key={index} style={styles.facilityItem}>
                    <Text style={styles.facilityText}>• {facility}</Text>
                  </View>
                ))}
                {item.facilities.length > 3 && (
                  <Text style={styles.moreText}>+{item.facilities.length - 3} อื่นๆ</Text>
                )}
              </View>
            </View>
          )}
          
          {/* Book Button */}
          <TouchableOpacity
            style={buttonStyle}
            onPress={() => {
              if (!isLoggedIn) {
                Alert.alert(
                  'กรุณาเข้าสู่ระบบ',
                  'คุณต้องเข้าสู่ระบบก่อนจองห้อง',
                  [{ text: 'ตกลง' }]
                );
                return;
              }
              
              if (!isRoomAvailable) {
                Alert.alert('ห้องไม่ว่าง', 'ขณะนี้ห้องนี้ไม่สามารถจองได้');
                return;
              }
              
              setSelectedRoom(item);
              setBookingVisible(true);
            }}
          >
            <Text style={styles.bookButtonText}>{buttonText}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
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
                      value={startDate.toISOString().split('T')[0]}
                      onChange={(e) => {
                        const newDate = new Date(e.target.value);
                        if (!isNaN(newDate.getTime())) {
                          setStartDate(newDate);
                          updateDateTimeString('start');
                        }
                      }}
                    />
                  ) : (
                    <TouchableOpacity 
                      style={[styles.input, styles.dateButton]}
                      onPress={() => setShowStartDatePicker(true)}
                    >
                      <Text style={styles.dateButtonText}>
                        {startDate.toLocaleDateString('th-TH')}
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
                      value={endDate.toISOString().split('T')[0]}
                      onChange={(e) => {
                        const newDate = new Date(e.target.value);
                        if (!isNaN(newDate.getTime())) {
                          setEndDate(newDate);
                          updateDateTimeString('end');
                        }
                      }}
                    />
                  ) : (
                    <TouchableOpacity 
                      style={[styles.input, styles.dateButton]}
                      onPress={() => setShowEndDatePicker(true)}
                    >
                      <Text style={styles.dateButtonText}>
                        {endDate.toLocaleDateString('th-TH')}
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
                        onPress={() => setShowStartHourPicker(!showStartHourPicker)}
                      >
                        <Text style={styles.timePickerText}>{startHour}</Text>
                        <Text style={styles.dropdownIcon}>▼</Text>
                      </TouchableOpacity>
                      <Text style={styles.timeSeparator}>:</Text>
                      <TouchableOpacity 
                        style={styles.timePickerButton}
                        onPress={() => setShowStartMinutePicker(!showStartMinutePicker)}
                      >
                        <Text style={styles.timePickerText}>{startMinute}</Text>
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
                        onPress={() => setShowEndHourPicker(!showEndHourPicker)}
                      >
                        <Text style={styles.timePickerText}>{endHour}</Text>
                        <Text style={styles.dropdownIcon}>▼</Text>
                      </TouchableOpacity>
                      <Text style={styles.timeSeparator}>:</Text>
                      <TouchableOpacity 
                        style={styles.timePickerButton}
                        onPress={() => setShowEndMinutePicker(!showEndMinutePicker)}
                      >
                        <Text style={styles.timePickerText}>{endMinute}</Text>
                        <Text style={styles.dropdownIcon}>▼</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              {/* Quick Fill Buttons */}
              <View style={styles.quickActionRow}>
                <TouchableOpacity 
                  style={styles.quickActionButton} 
                  onPress={() => setCurrentDateTime('start')}
                >
                  <Text style={styles.quickActionText}>ตอนนี้</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickActionButton} 
                  onPress={() => setFutureDateTime(1, 'start')}
                >
                  <Text style={styles.quickActionText}>พรุ่งนี้</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickActionButton} 
                  onPress={() => setFutureDateTime(7, 'start')}
                >
                  <Text style={styles.quickActionText}>อาทิตย์หน้า</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Dropdown Menus */}
            {showStartHourPicker && (
              <View style={styles.dropdownOverlay}>
                <View style={styles.dropdownContainer}>
                  <View style={styles.dropdownHeader}>
                    <Text style={styles.dropdownTitle}>เลือกชั่วโมงเริ่ม</Text>
                    <TouchableOpacity 
                      style={styles.closeButton}
                      onPress={() => setShowStartHourPicker(false)}
                    >
                      <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.dropdownGrid}>
                    {hours.map((hour) => (
                      <TouchableOpacity
                        key={hour}
                        style={[styles.dropdownItem, startHour === hour && styles.dropdownItemSelected]}
                        onPress={() => {
                          setStartHour(hour);
                          setShowStartHourPicker(false);
                          updateDateTimeString('start');
                        }}
                      >
                        <Text style={[styles.dropdownItemText, startHour === hour && styles.dropdownItemTextSelected]}>{hour}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {showStartMinutePicker && (
              <View style={styles.dropdownOverlay}>
                <View style={styles.dropdownContainer}>
                  <View style={styles.dropdownHeader}>
                    <Text style={styles.dropdownTitle}>เลือกนาทีเริ่ม</Text>
                    <TouchableOpacity 
                      style={styles.closeButton}
                      onPress={() => setShowStartMinutePicker(false)}
                    >
                      <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.dropdownGrid}>
                    {minutes.filter((_, index) => index % 5 === 0).map((minute) => (
                      <TouchableOpacity
                        key={minute}
                        style={[styles.dropdownItem, startMinute === minute && styles.dropdownItemSelected]}
                        onPress={() => {
                          setStartMinute(minute);
                          setShowStartMinutePicker(false);
                          updateDateTimeString('start');
                        }}
                      >
                        <Text style={[styles.dropdownItemText, startMinute === minute && styles.dropdownItemTextSelected]}>{minute}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {showEndHourPicker && (
              <View style={styles.dropdownOverlay}>
                <View style={styles.dropdownContainer}>
                  <View style={styles.dropdownHeader}>
                    <Text style={styles.dropdownTitle}>เลือกชั่วโมงสิ้นสุด</Text>
                    <TouchableOpacity 
                      style={styles.closeButton}
                      onPress={() => setShowEndHourPicker(false)}
                    >
                      <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.dropdownGrid}>
                    {hours.map((hour) => (
                      <TouchableOpacity
                        key={hour}
                        style={[styles.dropdownItem, endHour === hour && styles.dropdownItemSelected]}
                        onPress={() => {
                          setEndHour(hour);
                          setShowEndHourPicker(false);
                          updateDateTimeString('end');
                        }}
                      >
                        <Text style={[styles.dropdownItemText, endHour === hour && styles.dropdownItemTextSelected]}>{hour}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {showEndMinutePicker && (
              <View style={styles.dropdownOverlay}>
                <View style={styles.dropdownContainer}>
                  <View style={styles.dropdownHeader}>
                    <Text style={styles.dropdownTitle}>เลือกนาทีสิ้นสุด</Text>
                    <TouchableOpacity 
                      style={styles.closeButton}
                      onPress={() => setShowEndMinutePicker(false)}
                    >
                      <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.dropdownGrid}>
                    {minutes.filter((_, index) => index % 5 === 0).map((minute) => (
                      <TouchableOpacity
                        key={minute}
                        style={[styles.dropdownItem, endMinute === minute && styles.dropdownItemSelected]}
                        onPress={() => {
                          setEndMinute(minute);
                          setShowEndMinutePicker(false);
                          updateDateTimeString('end');
                        }}
                      >
                        <Text style={[styles.dropdownItemText, endMinute === minute && styles.dropdownItemTextSelected]}>{minute}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}
            
            <Text style={styles.inputLabel}>ระยะเวลา (ชั่วโมง)</Text>
            <TextInput
              style={[styles.input, styles.readonlyInput]}
              placeholder="ระยะเวลาจะคำนวณอัตโนมัติ"
              value={duration}
              editable={false}
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
                  // Reset date states
                  const now = new Date();
                  setStartDate(now);
                  setEndDate(now);
                }}
              >
                <Text>ยกเลิก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DateTimePickers - Only on mobile */}
      {Platform.OS !== 'web' && DateTimePicker && (
        <>
          {showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onStartDateChange}
              minimumDate={new Date()}
            />
          )}

          {showStartTimePicker && (
            <DateTimePicker
              value={startDate}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onStartTimeChange}
            />
          )}

          {showEndDatePicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onEndDateChange}
              minimumDate={new Date()}
            />
          )}

          {showEndTimePicker && (
            <DateTimePicker
              value={endDate}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onEndTimeChange}
            />
          )}
        </>
      )}

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
    shadowRadius: 4,
  },
  // New Room Card Styles
  roomCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  roomImageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#f8f9fa',
    overflow: 'hidden',
  },
  roomImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e9ecef',
  },
  roomIcon: {
    fontSize: 48,
    color: '#fff',
    zIndex: 2,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomContent: {
    padding: 16,
  },
  roomName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#212529',
    fontFamily: 'Sarabun',
  },
  roomBuilding: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 12,
    fontFamily: 'Sarabun',
  },
  roomFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  featureTag: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  featureText: {
    color: '#495057',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Sarabun',
  },
  statusTag: {
    marginLeft: 'auto',
  },
  availableTag: {
    backgroundColor: '#e8f5e8',
  },
  unavailableTag: {
    backgroundColor: '#ffebee',
  },
  availableText: {
    color: '#2e7d32',
  },
  unavailableText: {
    color: '#c62828',
  },
  facilitiesContainer: {
    marginBottom: 15,
  },
  facilitiesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    fontFamily: 'Sarabun',
  },
  facilitiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  facilityItem: {
    marginRight: 8,
    marginBottom: 4,
  },
  facilityText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Sarabun',
  },
  moreText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
    fontFamily: 'Sarabun',
  },
  // Existing styles  
  image: {
    width: 80,
    height: 80,
    marginRight: 16,
    borderRadius: 12,
    backgroundColor: '#eee',
  },
  title: {
    fontFamily: 'Sarabun_600SemiBold',
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
  quickDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
    marginBottom: 8,
  },
  quickDateButton: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2196f3',
  },
  quickDateText: {
    color: '#1976d2',
    fontSize: 12,
    fontWeight: '500',
  },
  dateButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderColor: '#dee2e6',
    borderWidth: 1,
    minHeight: 44,
  },
  dateButtonText: {
    color: '#495057',
    fontSize: 14,
    fontWeight: '500',
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
  // New grid-based date/time styles
  dateRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  dateSection: {
    marginBottom: 20,
  },
  dateColumn: {
    marginBottom: 15,
  },
  columnLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  timeSection: {
    marginTop: 10,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
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
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 60,
  },
  timePickerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  dropdownIcon: {
    fontSize: 10,
    color: '#666',
    marginLeft: 8,
  },
  timeSeparator: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 8,
  },
  quickActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    marginBottom: 15,
  },
  quickActionButton: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2196f3',
  },
  quickActionText: {
    color: '#1976d2',
    fontSize: 12,
    fontWeight: '500',
  },
  // Dropdown styles
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 20,
    padding: 20,
    maxHeight: '80%',
    width: '90%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  dropdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dropdownItem: {
    width: '18%',
    aspectRatio: 1,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  dropdownItemSelected: {
    backgroundColor: '#2196f3',
    borderColor: '#1976d2',
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  dropdownItemTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  readonlyInput: {
    backgroundColor: '#f8f9fa',
    color: '#666',
  },
});