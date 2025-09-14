import React, { useState, useEffect } from 'react';
import { View, Text, Button, Modal, TextInput, StyleSheet, Alert, Platform, Animated, TouchableOpacity, Image, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

// Import ImagePicker conditionally (not supported on web)
let ImagePicker = null;
if (Platform.OS !== 'web') {
  try {
    ImagePicker = require('expo-image-picker');
  } catch (e) {
    console.log('ImagePicker not available');
  }
}

export default function ProfileScreen() {
  const [loginVisible, setLoginVisible] = useState(false);
  const [registerVisible, setRegisterVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  // Login state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register state
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regFullname, setRegFullname] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState('student');

  // User profile state
  const [profile, setProfile] = useState(null);

  // Profile image state
  const [imageUploadVisible, setImageUploadVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // success notification state
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [errorFadeAnim] = useState(new Animated.Value(0));

  // ดึงข้อมูล profile ตอน component mount และหลัง login
  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('jwt_token');
      if (token) {
        const res = await fetch('http://localhost:5001/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        } else {
          // Token หมดอายุหรือไม่ valid
          await AsyncStorage.removeItem('jwt_token');
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
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

  // ฟังก์ชันแสดง error notification
  const showErrorNotification = (message) => {
    setErrorMessage(message);
    setErrorVisible(true);
    
    // Animation fade in
    Animated.sequence([
      Animated.timing(errorFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2500), // แสดงผล 2.5 วินาที
      Animated.timing(errorFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setErrorVisible(false);
    });
  };

  // Login handler
  const handleLogin = async () => {
    if (!loginUsername || !loginPassword) {
      showErrorNotification('กรุณาใส่ Username และ Password');
      return;
    }

    try {
      const res = await fetch('http://localhost:5001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      const data = await res.json();
      
      if (res.ok && data.accessToken) {
        await AsyncStorage.setItem('jwt_token', data.accessToken);
        
        // Clear login form
        setLoginUsername('');
        setLoginPassword('');
        setShowLoginPassword(false);
        setLoginVisible(false);
        
        // ดึง profile ใหม่
        await fetchProfile();
        
        showSuccessNotification('เข้าสู่ระบบสำเร็จ ✅');
      } else {
        showErrorNotification(data.message || 'เข้าสู่ระบบไม่สำเร็จ');
      }
    } catch (error) {
      console.error('Login error:', error);
      showErrorNotification('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  // Register handler
  const handleRegister = async () => {
    if (!regUsername || !regPassword || !regConfirmPassword || !regFullname || !regEmail) {
      showErrorNotification('กรุณาใส่ข้อมูลให้ครบถ้วน');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      showErrorNotification('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    if (regPassword.length < 6) {
      showErrorNotification('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    try {
      const res = await fetch('http://localhost:5001/api/regis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername,
          password: regPassword,
          fullname: regFullname,
          email: regEmail,
          role: regRole,
        }),
      });
      const data = await res.json();
      
      if (res.ok) {
        // Clear register form
        setRegUsername('');
        setRegPassword('');
        setRegConfirmPassword('');
        setShowRegPassword(false);
        setShowRegConfirmPassword(false);
        setRegFullname('');
        setRegEmail('');
        setRegRole('student');
        setRegisterVisible(false);
        
        showSuccessNotification('สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ ✅');
      } else {
        showErrorNotification(data.message || 'สมัครสมาชิกไม่สำเร็จ');
      }
    } catch (error) {
      console.error('Register error:', error);
      showErrorNotification('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  // Logout handler
  const handleLogout = async () => {
    await AsyncStorage.removeItem('jwt_token');
    setProfile(null);
    setLoading(false);
    showSuccessNotification('ออกจากระบบแล้ว ✅');
  };

  // ฟังก์ชันตรวจสอบสถานะเซิร์ฟเวอร์
  const checkServerHealth = async () => {
    try {
      // ลองเรียก API อื่นที่รู้ว่าทำงาน เช่น profile API
      const response = await fetch('http://localhost:5001/api/profile', {
        method: 'GET',
        timeout: 5000,
      });
      
      console.log('Server health check result:', {
        status: response.status,
        statusText: response.statusText
      });
      
      if (response.ok || response.status === 401) {
        // 401 แสดงว่าเซิร์ฟเวอร์ทำงาน แต่ต้องการ token
        console.log('Server is running');
        return true;
      } else {
        console.warn('Server responded with status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Server health check failed:', error);
      return false;
    }
  };

  // ฟังก์ชันทดสอบ upload endpoint
  const testUploadEndpoint = async () => {
    try {
      const token = await AsyncStorage.getItem('jwt_token');
      const response = await fetch('http://localhost:5001/api/user/image', {
        method: 'OPTIONS', // CORS preflight request
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('Upload endpoint test:', {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      return response.status < 500;
    } catch (error) {
      console.error('Upload endpoint test failed:', error);
      return false;
    }
  };

  // ฟังก์ชันขอ permission สำหรับการเข้าถึงรูปภาพ
  const requestImagePermission = async () => {
    if (Platform.OS === 'web' || !ImagePicker) {
      return true; // Web ไม่ต้องขอ permission
    }
    
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('ขออภัย', 'ต้องการสิทธิ์เข้าถึงรูปภาพเพื่อเปลี่ยนรูปโปรไฟล์');
        return false;
      }
      return true;
    } catch (error) {
      console.log('Permission request failed:', error);
      return Platform.OS === 'web'; // Allow on web even if ImagePicker fails
    }
  };

  // ฟังก์ชันเลือกรูปภาพจาก gallery
  const pickImage = async () => {
    if (Platform.OS === 'web') {
      // Web fallback - use HTML input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setSelectedImage({
              uri: e.target.result,
              type: file.type,
              name: file.name,
              file: file, // Keep file object for upload
            });
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
      return;
    }

    if (!ImagePicker) {
      showErrorNotification('การเลือกรูปภาพไม่รองรับบนแพลตฟอร์มนี้');
      return;
    }

    const hasPermission = await requestImagePermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // ตัดเป็นสี่เหลี่ยมจัตุรัส
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showErrorNotification('ไม่สามารถเลือกรูปภาพได้');
    }
  };

  // ฟังก์ชันถ่ายรูปจากกล้อง
  const takePhoto = async () => {
    if (Platform.OS === 'web' || !ImagePicker) {
      showErrorNotification('การถ่ายรูปไม่รองรับบนแพลตฟอร์มนี้');
      return;
    }

    const hasPermission = await requestImagePermission();
    if (!hasPermission) return;

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('ขออภัย', 'ต้องการสิทธิ์เข้าถึงกล้องเพื่อถ่ายรูปโปรไฟล์');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      showErrorNotification('ไม่สามารถถ่ายรูปได้');
    }
  };

  // ฟังก์ชันตรวจสอบไฟล์ภาพ
  const validateImageFile = (imageData) => {
    // ตรวจสอบขนาดไฟล์ (ไม่เกิน 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (Platform.OS === 'web' && imageData.file) {
      if (imageData.file.size > maxSize) {
        showErrorNotification('ขนาดไฟล์ใหญ่เกินไป (สูงสุด 5MB)');
        return false;
      }
      
      // ตรวจสอบชนิดไฟล์
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(imageData.file.type)) {
        showErrorNotification('รองรับเฉพาะไฟล์ JPG, PNG และ GIF เท่านั้น');
        return false;
      }
    }
    
    return true;
  };

  // ฟังก์ชันอัพโหลดรูปโปรไฟล์
  const uploadProfileImage = async () => {
    if (!selectedImage) {
      showErrorNotification('กรุณาเลือกรูปภาพก่อน');
      return;
    }

    // ตรวจสอบไฟล์ก่อนอัพโหลด
    if (!validateImageFile(selectedImage)) {
      return;
    }

    setUploadLoading(true);
    try {
      const token = await AsyncStorage.getItem('jwt_token');
      if (!token) {
        showErrorNotification('กรุณาเข้าสู่ระบบก่อน');
        setUploadLoading(false);
        return;
      }

      // Debug token (แสดงเฉพาะส่วนหัวและท้าย)
      console.log('Using token:', {
        hasToken: !!token,
        tokenStart: token ? token.substring(0, 20) + '...' : 'none',
        tokenLength: token ? token.length : 0
      });

      // ตรวจสอบสถานะเซิร์ฟเวอร์ก่อน
      console.log('Checking server health...');
      const serverHealthy = await checkServerHealth();
      if (!serverHealthy) {
        console.warn('Server may not be running properly');
        showErrorNotification('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบว่าเซิร์ฟเวอร์ทำงานอยู่');
        setUploadLoading(false);
        return;
      }

      // ทดสอบ upload endpoint
      console.log('Testing upload endpoint...');
      const endpointWorking = await testUploadEndpoint();
      if (!endpointWorking) {
        console.warn('Upload endpoint may not be available');
      }

      console.log('Starting image upload...', {
        platform: Platform.OS,
        imageUri: selectedImage.uri,
        hasFile: !!selectedImage.file
      });

      const formData = new FormData();
      
      if (Platform.OS === 'web' && selectedImage.file) {
        // Web - use File object
        console.log('Using File object for web:', {
          name: selectedImage.file.name,
          type: selectedImage.file.type,
          size: selectedImage.file.size
        });
        formData.append('profile_image', selectedImage.file, selectedImage.file.name);
      } else {
        // Mobile - use URI
        console.log('Using URI for mobile:', {
          uri: selectedImage.uri,
          type: selectedImage.type || 'image/jpeg',
          name: selectedImage.name || 'profile.jpg'
        });
        formData.append('profile_image', {
          uri: selectedImage.uri,
          type: selectedImage.type || 'image/jpeg',
          name: selectedImage.name || 'profile.jpg',
        });
      }

      // แสดงข้อมูล FormData สำหรับ debug
      console.log('FormData entries:');
      for (let pair of formData.entries()) {
        console.log(pair[0], ':', pair[1]);
      }

      console.log('Sending request to server...');
      const response = await fetch('http://localhost:5001/api/user/image', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData, let browser set it with boundary
        },
        body: formData,
      });

      console.log('Server response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        headers: Object.fromEntries(response.headers.entries())
      });

      // ตรวจสอบ Content-Type ก่อนพยายาม parse JSON
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        console.log('Parsed JSON response:', data);
      } else {
        // ถ้าไม่ใช่ JSON ให้อ่านเป็น text เพื่อ debug
        const textResponse = await response.text();
        console.log('Raw response (first 500 chars):', textResponse.substring(0, 500));
        console.log('Full response length:', textResponse.length);
        
        // ตรวจสอบว่าเป็น HTML error page หรือไม่
        if (textResponse.includes('<!DOCTYPE') || textResponse.includes('<html')) {
          console.error('Server returned HTML error page instead of JSON');
          data = { 
            error: 'เซิร์ฟเวอร์เกิดข้อผิดพลาด กรุณาตรวจสอบ console ของเซิร์ฟเวอร์',
            raw_response: textResponse.substring(0, 200)
          };
        } else {
          // พยายาม parse เป็น JSON ในกรณีที่ server ส่งมาผิด content-type
          try {
            data = JSON.parse(textResponse);
            console.log('Successfully parsed JSON from text response:', data);
          } catch (parseError) {
            console.error('Failed to parse response as JSON:', parseError);
            data = { 
              error: response.status === 500 
                ? 'เซิร์ฟเวอร์เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' 
                : 'เกิดข้อผิดพลาดในการอัพโหลด',
              parse_error: parseError.message,
              raw_response: textResponse.substring(0, 200)
            };
          }
        }
      }

      if (response.ok) {
        console.log('Upload successful:', data);
        showSuccessNotification('อัพโหลดรูปโปรไฟล์สำเร็จ! 📸');
        setImageUploadVisible(false);
        setSelectedImage(null);
        
        // อัพเดทข้อมูลโปรไฟล์ด้วยข้อมูลใหม่จาก response
        if (data.user) {
          setProfile(data.user);
        } else {
          // รีเฟรชข้อมูลโปรไฟล์จาก API
          await fetchProfile();
        }
      } else {
        console.error('Upload failed:', {
          status: response.status,
          data: data
        });
        
        // แสดงข้อความ error ที่เฉพาะเจาะจง
        if (response.status === 400) {
          showErrorNotification(data.error || 'ไฟล์รูปภาพไม่ถูกต้อง');
        } else if (response.status === 413) {
          showErrorNotification('ไฟล์ใหญ่เกินไป (สูงสุด 5MB)');
        } else if (response.status === 404) {
          showErrorNotification('ไม่พบ API endpoint กรุณาตรวจสอบเซิร์ฟเวอร์');
        } else if (response.status === 500) {
          showErrorNotification('เซิร์ฟเวอร์เกิดข้อผิดพลาด กรุณาตรวจสอบ console ของเซิร์ฟเวอร์');
        } else {
          showErrorNotification(data.error || `อัพโหลดไม่สำเร็จ (${response.status})`);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        showErrorNotification('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ');
      } else {
        showErrorNotification('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ');
      }
    } finally {
      setUploadLoading(false);
    }
  };

  // แสดง loading ตอนกำลังตรวจสอบ token
  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {profile ? (
        // แสดงข้อมูล user เมื่อ login แล้ว
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Image Section */}
          <View style={styles.profileImageSection}>
            <View style={styles.profileImageWrapper}>
              <TouchableOpacity 
                style={styles.profileImageContainer}
                onPress={() => setImageUploadVisible(true)}
                activeOpacity={0.8}
              >
                {profile.profile_image || profile.image_url ? (
                  <Image 
                    source={{ 
                      uri: profile.image_url || `http://localhost:5001/uploads/profile/${profile.profile_image}` 
                    }} 
                    style={styles.profileImage} 
                  />
                ) : (
                  <View style={styles.defaultProfileImage}>
                    <Ionicons name="person" size={60} color="#B0BEC5" />
                  </View>
                )}
                <View style={styles.cameraIconOverlay}>
                  <Ionicons name="camera" size={18} color="#fff" />
                </View>
              </TouchableOpacity>
              
              <Text style={styles.profileName}>{profile.fullname}</Text>
              <Text style={styles.profileRole}>
                {profile.role === 'teacher' ? '👨‍🏫 อาจารย์' : '👨‍🎓 นักเรียน'}
              </Text>
              
              <TouchableOpacity 
                style={styles.changeImageButton}
                onPress={() => setImageUploadVisible(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="camera-outline" size={16} color="#4A90E2" />
                <Text style={styles.changeImageText}>เปลี่ยนรูปโปรไฟล์</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile Info Cards */}
          <View style={styles.profileInfoContainer}>
            <View style={styles.infoCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="person-circle-outline" size={24} color="#4A90E2" />
                <Text style={styles.cardTitle}>ข้อมูลส่วนตัว</Text>
              </View>
              
              <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="person-outline" size={20} color="#666" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>ชื่อ-นามสกุล</Text>
                    <Text style={styles.infoValue}>{profile.fullname}</Text>
                  </View>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="at-outline" size={20} color="#666" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>ชื่อผู้ใช้</Text>
                    <Text style={styles.infoValue}>@{profile.username}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="mail-outline" size={24} color="#4A90E2" />
                <Text style={styles.cardTitle}>การติดต่อ</Text>
              </View>
              
              <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="mail" size={20} color="#666" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>อีเมล</Text>
                    <Text style={styles.infoValue}>{profile.email}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.cardHeader}>
                <Ionicons 
                  name={profile.role === 'teacher' ? 'school-outline' : 'book-outline'} 
                  size={24} 
                  color="#4A90E2" 
                />
                <Text style={styles.cardTitle}>สถานะ</Text>
              </View>
              
              <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons 
                      name={profile.role === 'teacher' ? 'school' : 'book'} 
                      size={20} 
                      color={profile.role === 'teacher' ? '#e74c3c' : '#27ae60'} 
                    />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>บทบาท</Text>
                    <View style={styles.roleBadge}>
                      <Text style={[
                        styles.roleText,
                        profile.role === 'teacher' ? styles.teacherRole : styles.studentRole
                      ]}>
                        {profile.role === 'teacher' ? 'อาจารย์' : 'นักเรียน'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
          
          {/* Logout Button */}
          <View style={styles.actionButtonContainer}>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={20} color="#fff" />
              <Text style={styles.logoutButtonText}>ออกจากระบบ</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        // แสดง UI เหมือนกันแต่ไม่มีข้อมูล เมื่อยังไม่ login
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Image Section - ไม่สามารถกดได้ */}
          <View style={styles.profileImageSection}>
            <View style={styles.profileImageWrapper}>
              <View style={styles.profileImageContainer}>
                <View style={styles.defaultProfileImage}>
                  <Ionicons name="person" size={60} color="#B0BEC5" />
                </View>
              </View>
              
              <Text style={styles.profileName}>ยังไม่ได้เข้าสู่ระบบ</Text>
              <Text style={styles.profileRole}>กรุณาเข้าสู่ระบบเพื่อใช้งาน</Text>
            </View>
          </View>

          {/* Profile Info Cards - ไม่มีข้อมูล */}
          <View style={styles.profileInfoContainer}>
            <View style={styles.infoCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="person-circle-outline" size={24} color="#4A90E2" />
                <Text style={styles.cardTitle}>ข้อมูลส่วนตัว</Text>
              </View>
              
              <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="person-outline" size={20} color="#666" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>ชื่อ-นามสกุล</Text>
                    <Text style={[styles.infoValue, styles.placeholderText]}>-</Text>
                  </View>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="at-outline" size={20} color="#666" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>ชื่อผู้ใช้</Text>
                    <Text style={[styles.infoValue, styles.placeholderText]}>-</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="mail-outline" size={24} color="#4A90E2" />
                <Text style={styles.cardTitle}>การติดต่อ</Text>
              </View>
              
              <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="mail" size={20} color="#666" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>อีเมล</Text>
                    <Text style={[styles.infoValue, styles.placeholderText]}>-</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="school-outline" size={24} color="#4A90E2" />
                <Text style={styles.cardTitle}>สถานะ</Text>
              </View>
              
              <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Ionicons name="help-outline" size={20} color="#666" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>บทบาท</Text>
                    <Text style={[styles.infoValue, styles.placeholderText]}>-</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
          
          {/* Login Prompt */}
          <View style={styles.actionButtonContainer}>
            <View style={styles.loginPromptCard}>
              <Ionicons name="log-in-outline" size={32} color="#4A90E2" style={styles.loginIconStyle} />
              <Text style={styles.loginTitle}>เข้าสู่ระบบ</Text>
              <Text style={styles.loginSubtitle}>
                กรุณาเข้าสู่ระบบเพื่อดูข้อมูลโปรไฟล์และใช้งานระบบจองห้อง
              </Text>
              
              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={() => setLoginVisible(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="log-in-outline" size={16} color="#fff" />
                  <Text style={styles.primaryButtonText}>เข้าสู่ระบบ</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.secondaryButton}
                  onPress={() => setRegisterVisible(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="person-add-outline" size={16} color="#4A90E2" />
                  <Text style={styles.secondaryButtonText}>สมัครสมาชิก</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Login Modal */}
      <Modal visible={loginVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>เข้าสู่ระบบ</Text>
            <TextInput
              placeholder="ชื่อผู้ใช้"
              value={loginUsername}
              onChangeText={setLoginUsername}
              style={styles.input}
              autoCapitalize="none"
            />
            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="รหัสผ่าน"
                value={loginPassword}
                onChangeText={setLoginPassword}
                style={styles.passwordInput}
                secureTextEntry={!showLoginPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowLoginPassword(!showLoginPassword)}
              >
                <Ionicons
                  name={showLoginPassword ? "eye" : "eye-off"}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            <View style={styles.row}>
              <Button title="เข้าสู่ระบบ" onPress={handleLogin} />
              <Button 
                title="ยกเลิก" 
                color="grey" 
                onPress={() => {
                  setLoginVisible(false);
                  setLoginUsername('');
                  setLoginPassword('');
                  setShowLoginPassword(false);
                }} 
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Register Modal */}
      <Modal visible={registerVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>สมัครสมาชิก</Text>
            <TextInput
              placeholder="ชื่อผู้ใช้"
              value={regUsername}
              onChangeText={setRegUsername}
              style={styles.input}
              autoCapitalize="none"
            />
            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="รหัสผ่าน"
                value={regPassword}
                onChangeText={setRegPassword}
                style={styles.passwordInput}
                secureTextEntry={!showRegPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowRegPassword(!showRegPassword)}
              >
                <Ionicons
                  name={showRegPassword ? "eye" : "eye-off"}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="ยืนยันรหัสผ่าน"
                value={regConfirmPassword}
                onChangeText={setRegConfirmPassword}
                style={styles.passwordInput}
                secureTextEntry={!showRegConfirmPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
              >
                <Ionicons
                  name={showRegConfirmPassword ? "eye" : "eye-off"}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            <TextInput
              placeholder="ชื่อจริง"
              value={regFullname}
              onChangeText={setRegFullname}
              style={styles.input}
            />
            <TextInput
              placeholder="อีเมล"
              value={regEmail}
              onChangeText={setRegEmail}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>บทบาท:</Text>
              <Picker
                selectedValue={regRole}
                style={styles.picker}
                onValueChange={(itemValue) => setRegRole(itemValue)}
                mode="dropdown"
              >
                <Picker.Item label="นักเรียน" value="student" />
                <Picker.Item label="อาจารย์" value="teacher" />
              </Picker>
            </View>
            <View style={styles.row}>
              <Button title="สมัครสมาชิก" onPress={handleRegister} />
              <Button 
                title="ยกเลิก" 
                color="grey" 
                onPress={() => {
                  setRegisterVisible(false);
                  setRegUsername('');
                  setRegPassword('');
                  setShowRegPassword(false);
                  setRegFullname('');
                  setRegEmail('');
                  setRegRole('student');
                }} 
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Upload Modal */}
      <Modal visible={imageUploadVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.imageUploadModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>เปลี่ยนรูปโปรไฟล์</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setImageUploadVisible(false);
                  setSelectedImage(null);
                }}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {/* Selected Image Preview */}
            {selectedImage && (
              <View style={styles.imagePreviewContainer}>
                <View style={styles.previewImageWrapper}>
                  <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} />
                  <View style={styles.previewOverlay}>
                    <Ionicons name="checkmark-circle" size={30} color="#4CAF50" />
                  </View>
                </View>
                <Text style={styles.previewText}>✨ รูปที่เลือกแล้ว</Text>
              </View>
            )}

            {/* Image Selection Section */}
            <View style={styles.selectionSection}>
              <Text style={styles.sectionTitle}>เลือกวิธีการอัพโหลด</Text>
              
              <View style={styles.imageButtonContainer}>
                <TouchableOpacity 
                  style={styles.imageButton} 
                  onPress={pickImage}
                  activeOpacity={0.7}
                >
                  <View style={styles.buttonIconContainer}>
                    <Ionicons name="images" size={28} color="#4A90E2" />
                  </View>
                  <View style={styles.buttonTextContainer}>
                    <Text style={styles.imageButtonTitle}>เลือกจากแกลเลอรี่</Text>
                    <Text style={styles.imageButtonSubtitle}>เลือกรูปจากอุปกรณ์ของคุณ</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#B0BEC5" />
                </TouchableOpacity>
                
                {Platform.OS !== 'web' && ImagePicker && (
                  <TouchableOpacity 
                    style={styles.imageButton} 
                    onPress={takePhoto}
                    activeOpacity={0.7}
                  >
                    <View style={styles.buttonIconContainer}>
                      <Ionicons name="camera" size={28} color="#4A90E2" />
                    </View>
                    <View style={styles.buttonTextContainer}>
                      <Text style={styles.imageButtonTitle}>ถ่ายรูปใหม่</Text>
                      <Text style={styles.imageButtonSubtitle}>ใช้กล้องถ่ายรูปโปรไฟล์</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#B0BEC5" />
                  </TouchableOpacity>
                )}
                
                {Platform.OS === 'web' && (
                  <View style={styles.webNotice}>
                    <Ionicons name="information-circle" size={20} color="#FF9800" />
                    <Text style={styles.webHelpText}>
                      บน Web สามารถเลือกรูปจากแกลเลอรี่เท่านั้น
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelActionButton]}
                onPress={() => {
                  setImageUploadVisible(false);
                  setSelectedImage(null);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="close-outline" size={20} color="#666" />
                <Text style={styles.cancelButtonText}>ยกเลิก</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.actionButton, 
                  styles.uploadActionButton, 
                  (!selectedImage || uploadLoading) && styles.disabledButton
                ]}
                onPress={uploadProfileImage}
                disabled={!selectedImage || uploadLoading}
                activeOpacity={0.8}
              >
                {uploadLoading ? (
                  <>
                    <Ionicons name="refresh" size={20} color="#fff" />
                    <Text style={styles.uploadButtonText}>กำลังอัพโหลด...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                    <Text style={styles.uploadButtonText}>อัพโหลดรูป</Text>
                  </>
                )}
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

      {/* Error Notification */}
      {errorVisible && (
        <Animated.View style={[styles.errorNotification, { opacity: errorFadeAnim }]}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#2c3e50',
    fontFamily: 'Sarabun_700Bold',
  },
  // Login Styles
  loginPrompt: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  // Profile Container Styles
  profileContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginVertical: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      web: { boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)' },
    }),
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    fontFamily: 'Sarabun_700Bold',
    marginBottom: 5,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    fontFamily: 'Sarabun_400Regular',
  },
  // Profile Image Styles
  profileImageSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  profileImageWrapper: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    width: '100%',
    maxWidth: 300,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 6,
    fontFamily: 'Sarabun',
  },
  profileRole: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Sarabun',
  },
  // Profile Info Cards
  profileInfoContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafe',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e8f2ff',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 12,
    fontFamily: 'Sarabun',
  },
  cardContent: {
    padding: 20,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 16,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f0f9ff',
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Sarabun',
  },
  actionButtonContainer: {
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
      web: { boxShadow: '0px 4px 12px rgba(74, 144, 226, 0.3)' },
    }),
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#4A90E2',
  },
  defaultProfileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ecf0f1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#bdc3c7',
  },
  cameraIconOverlay: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#4A90E2',
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  changeImageText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: 'Sarabun_600SemiBold',
  },
  // Profile Info Cards
  profileInfoContainer: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
      web: { boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)' },
    }),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
    marginBottom: 2,
    fontFamily: 'Sarabun_500Medium',
  },
  infoValue: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '600',
    fontFamily: 'Sarabun_600SemiBold',
  },
  placeholderText: {
    color: '#cbd5e1',
    fontStyle: 'italic',
  },
  loginPromptCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    width: '100%',
  },
  loginIconStyle: {
    marginBottom: 16,
    backgroundColor: '#f0f7ff',
    padding: 16,
    borderRadius: 30,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Sarabun_700Bold',
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    fontFamily: 'Sarabun_400Regular',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Sarabun_600SemiBold',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#4A90E2',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryButtonText: {
    color: '#4A90E2',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Sarabun_600SemiBold',
  },
  roleValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  teacherRole: {
    color: '#e74c3c',
  },
  studentRole: {
    color: '#27ae60',
  },
  // Action Buttons
  actionButtonContainer: {
    paddingVertical: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#e74c3c',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#e74c3c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      web: { boxShadow: '0px 4px 8px rgba(231, 76, 60, 0.3)' },
    }),
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
    fontFamily: 'Sarabun_700Bold',
  },
  profileBox: {
    backgroundColor: '#f8f9fa',
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  profileText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#34495e',
  },
  buttonContainer: {
    marginTop: 16,
    width: '100%',
  },
  // Modal Styles
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageUploadModal: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 0,
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: { elevation: 15 },
      web: { boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.3)' },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    fontFamily: 'Sarabun_700Bold',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  // Image Preview Styles
  imagePreviewContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9ff',
  },
  previewImageWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  imagePreview: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: '#4A90E2',
  },
  previewOverlay: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 2,
  },
  previewText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
    fontFamily: 'Sarabun_600SemiBold',
  },
  // Selection Section
  selectionSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
    fontFamily: 'Sarabun_600SemiBold',
  },
  modalBox: {
    width: 320,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4.65,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.25)',
      },
    }),
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2c3e50',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  pickerContainer: {
    marginBottom: 12,
  },
  pickerLabel: {
    marginBottom: 8,
    fontSize: 16,
    color: '#2c3e50',
  },
  picker: {
    ...Platform.select({
      ios: { height: 120 },
      android: { height: 40 },
    }),
    width: '100%',
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
  // Error Notification Styles
  errorNotification: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: '#e74c3c',
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
  errorText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Password input with eye icon styles
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 12,
    paddingRight: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Sarabun_400Regular',
  },
  eyeIcon: {
    padding: 8,
  },
  // Profile image styles
  profileImageSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#4A90E2',
  },
  defaultProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ddd',
  },
  cameraIconOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4A90E2',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  changeImageButton: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  changeImageText: {
    color: '#1976d2',
    fontSize: 12,
    fontWeight: '500',
  },
  // Image upload modal styles
  imagePreviewContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imagePreview: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  previewText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  imageButtonContainer: {
    gap: 12,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e3f2fd',
    borderRadius: 12,
    backgroundColor: '#f8f9ff',
    ...Platform.select({
      ios: {
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
      web: { boxShadow: '0px 2px 8px rgba(74, 144, 226, 0.1)' },
    }),
  },
  buttonIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  imageButtonTitle: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '600',
    fontFamily: 'Sarabun_600SemiBold',
    marginBottom: 2,
  },
  imageButtonSubtitle: {
    fontSize: 12,
    color: '#7f8c8d',
    fontFamily: 'Sarabun_400Regular',
  },
  webNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcc02',
  },
  webHelpText: {
    fontSize: 12,
    color: '#f57c00',
    marginLeft: 8,
    flex: 1,
    fontFamily: 'Sarabun_400Regular',
  },
  // Modal Action Buttons
  modalActionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadActionButton: {
    backgroundColor: '#4A90E2',
    ...Platform.select({
      ios: {
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      web: { boxShadow: '0px 4px 8px rgba(74, 144, 226, 0.3)' },
    }),
  },
  cancelActionButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Sarabun_700Bold',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Sarabun_600SemiBold',
  },
  disabledButton: {
    backgroundColor: '#e9ecef',
    opacity: 0.6,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  uploadButton: {
    backgroundColor: '#4A90E2',
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  disabledText: {
    color: '#999',
  },
  webHelpText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
});