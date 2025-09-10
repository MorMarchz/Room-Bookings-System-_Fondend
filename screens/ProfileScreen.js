import React, { useState, useEffect } from 'react';
import { View, Text, Button, Modal, TextInput, StyleSheet, Alert, Platform, Animated, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

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
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regFullname, setRegFullname] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState('student');

  // User profile state
  const [profile, setProfile] = useState(null);

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
    if (!regUsername || !regPassword || !regFullname || !regEmail) {
      showErrorNotification('กรุณาใส่ข้อมูลให้ครบถ้วน');
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
        setShowRegPassword(false);
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
      <Text style={styles.title}>Profile Screen</Text>
      
      {/* Debug info - ลบออกเมื่อแก้ไขเสร็จแล้ว */}
      <Text style={{fontSize: 12, color: 'gray', marginBottom: 10}}>
        Profile state: {profile ? 'Loaded' : 'Not loaded'}
      </Text>
      
      {profile ? (
        // แสดงข้อมูล user เมื่อ login แล้ว
        <View style={styles.profileBox}>
          <Text style={styles.welcomeText}>ยินดีต้อนรับ!</Text>
          <Text style={styles.profileText}>ชื่อ: {profile.fullname}</Text>
          <Text style={styles.profileText}>อีเมล: {profile.email}</Text>
          <Text style={styles.profileText}>
            บทบาท: {profile.role === 'teacher' ? 'อาจารย์' : 'นักเรียน'}
          </Text>
          <Text style={styles.profileText}>ชื่อผู้ใช้: {profile.username}</Text>
          
          <View style={styles.buttonContainer}>
            <Button title="ออกจากระบบ" onPress={handleLogout} color="red" />
          </View>
        </View>
      ) : (
        // แสดงปุ่ม Login และ Register เมื่อยังไม่ได้ login
        <View>
          <Text style={styles.loginPrompt}>เข้าสู่ระบบเพื่อดูข้อมูลโปรไฟล์</Text>
          <View style={styles.buttonRow}>
            <Button title="เข้าสู่ระบบ" onPress={() => setLoginVisible(true)} />
            <Button title="สมัครสมาชิก" onPress={() => setRegisterVisible(true)} />
          </View>
        </View>
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
                  name={showLoginPassword ? "eye-off" : "eye"}
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
                  name={showRegPassword ? "eye-off" : "eye"}
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
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
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
});