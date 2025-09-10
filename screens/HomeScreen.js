import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  Dimensions,
  TouchableOpacity,
  FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const flatListRef = useRef(null);
  
  // ข้อมูลห้องพร้อมรูปภาพ
  const roomsData = [
    {
      id: 1,
      name: "ห้อง 4311",
      building: "ตึก 4",
      type: "Lab",
      capacity: 50,
      image: "https://images.unsplash.com/photo-1562774053-701939374585?w=800&h=600&fit=crop&crop=center",
      description: "ห้องปฏิบัติการคอมพิวเตอร์ พร้อมเครื่องมือครบครัน"
    },
    {
      id: 2,
      name: "ห้อง 7203",
      building: "ตึก 7", 
      type: "Classroom",
      capacity: 30,
      image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&h=600&fit=crop&crop=center",
      description: "ห้องเรียนขนาดกลาง เหมาะสำหรับการบรรยาย"
    },
    {
      id: 3,
      name: "ห้อง 4205",
      building: "ตึก 4",
      type: "Meeting",
      capacity: 20,
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop&crop=center",
      description: "ห้องประชุมสำหรับการพบปะหารือ"
    },
    {
      id: 4,
      name: "ห้อง 3305",
      building: "ตึก 3",
      type: "Lab",
      capacity: 35,
      image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&h=600&fit=crop&crop=center",
      description: "ห้องปฏิบัติการวิทยาศาสตร์ขั้นสูง"
    }
  ];

  // ฟีเจอร์ของระบบ
  const systemFeatures = [
    {
      icon: "📅",
      title: "จองห้องออนไลน์",
      description: "จองห้องได้ทุกที่ทุกเวลาผ่านระบบออนไลน์"
    },
    {
      icon: "👨‍💼",
      title: "ระบบอนุมัติ",
      description: "ผู้ดูแลระบบจะอนุมัติการจองอย่างรวดเร็ว"
    },
    {
      icon: "📋",
      title: "จัดการการจอง",
      description: "ดูประวัติ แก้ไข และยกเลิกการจองได้"
    },
    {
      icon: "🏢",
      title: "หลากหลายประเภทห้อง",
      description: "Lab, Classroom, Meeting Room ให้เลือกใช้"
    }
  ];

  // เลื่อนรูปภาพอัตโนมัติ
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % roomsData.length;
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({ 
            index: nextIndex, 
            animated: true 
          });
        }
        return nextIndex;
      });
    }, 4000); // เปลี่ยนทุก 4 วินาที

    return () => clearInterval(interval);
  }, [roomsData.length]);

  const renderRoomSlide = ({ item, index }) => (
    <View style={[styles.slideContainer, { width }]}>
      <Image source={{ uri: item.image }} style={styles.slideImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.slideGradient}
      >
        <View style={styles.slideContent}>
          <Text style={styles.roomName}>{item.name}</Text>
          <Text style={styles.roomBuilding}>{item.building}</Text>
          <Text style={styles.roomType}>{item.type} • ความจุ {item.capacity} คน</Text>
          <Text style={styles.roomDescription}>{item.description}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const handleScrollEnd = (event) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentImageIndex(newIndex);
  };

  const renderFeature = ({ item }) => (
    <View style={styles.featureCard}>
      <Text style={styles.featureIcon}>{item.icon}</Text>
      <Text style={styles.featureTitle}>{item.title}</Text>
      <Text style={styles.featureDescription}>{item.description}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <LinearGradient
        colors={['#4c63d2', '#2d98da']}
        style={styles.header}
      >
        <Text style={styles.systemTitle}>🏢 ระบบจองห้อง</Text>
        <Text style={styles.systemSubtitle}>Room Booking System</Text>
        <Text style={styles.welcomeText}>ยินดีต้อนรับสู่ระบบจองห้องออนไลน์</Text>
      </LinearGradient>

      {/* Room Slider */}
      <View style={styles.sliderSection}>
        <Text style={styles.sectionTitle}>ห้องที่พร้อมให้บริการ</Text>
        <View style={styles.sliderContainer}>
          <FlatList
            ref={flatListRef}
            data={roomsData}
            renderItem={renderRoomSlide}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScrollEnd}
            decelerationRate="fast"
            snapToInterval={width}
            snapToAlignment="start"
            contentContainerStyle={{ alignItems: 'center' }}
            getItemLayout={(data, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
          />
        </View>
        
        {/* Dots Indicator */}
        <View style={styles.dotsContainer}>
          {roomsData.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dot,
                index === currentImageIndex && styles.activeDot
              ]}
              onPress={() => {
                setCurrentImageIndex(index);
                flatListRef.current?.scrollToIndex({ 
                  index, 
                  animated: true 
                });
              }}
            />
          ))}
        </View>
      </View>

      {/* System Features */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>ฟีเจอร์ของระบบ</Text>
        <Text style={styles.sectionSubtitle}>ระบบจองห้องของเรามีความสามารถดังนี้</Text>
        
        <View style={styles.featuresGrid}>
          {systemFeatures.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Call to Action */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaTitle}>พร้อมที่จะเริ่มจองห้องแล้วหรือยัง?</Text>
        <TouchableOpacity 
          style={styles.ctaButton}
          onPress={() => navigation.navigate('Rooms')}
        >
          <Text style={styles.ctaButtonText}>🚀 เริ่มจองห้องเลย</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 Room Booking System</Text>
        <Text style={styles.footerSubText}>พัฒนาด้วย ❤️ เพื่อการใช้งานที่สะดวก</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  systemTitle: {
    fontSize: Math.min(32, width * 0.08),
    fontFamily: 'Sarabun_700Bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  systemSubtitle: {
    fontSize: Math.min(18, width * 0.045),
    fontFamily: 'Sarabun_500Medium',
    color: '#e8f4fd',
    marginBottom: 16,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: Math.min(16, width * 0.04),
    fontFamily: 'Sarabun_400Regular',
    color: '#b8ddf1',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  sliderSection: {
    marginTop: 30,
    marginBottom: 40,
  },
  sliderContainer: {
    height: Math.min(300, width * 0.6), // Responsive height
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: Math.min(24, width * 0.06), // Responsive font size
    fontFamily: 'Sarabun_600SemiBold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  sectionSubtitle: {
    fontSize: Math.min(16, width * 0.04),
    fontFamily: 'Sarabun_400Regular',
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  slideContainer: {
    position: 'relative',
    height: Math.min(300, width * 0.6),
    marginHorizontal: 0,
  },
  slideImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  slideGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    justifyContent: 'flex-end',
  },
  slideContent: {
    padding: Math.max(15, width * 0.04),
  },
  roomName: {
    fontSize: Math.min(28, width * 0.07),
    fontFamily: 'Sarabun_700Bold',
    color: '#fff',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  roomBuilding: {
    fontSize: Math.min(18, width * 0.045),
    fontFamily: 'Sarabun_500Medium',
    color: '#e8f4fd',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  roomType: {
    fontSize: Math.min(16, width * 0.04),
    fontFamily: 'Sarabun_400Regular',
    color: '#b8ddf1',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  roomDescription: {
    fontSize: Math.min(14, width * 0.035),
    fontFamily: 'Sarabun_400Regular',
    color: '#d5e8f3',
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    paddingHorizontal: 20,
  },
  dot: {
    width: Math.max(8, width * 0.02),
    height: Math.max(8, width * 0.02),
    borderRadius: Math.max(4, width * 0.01),
    backgroundColor: '#bdc3c7',
    marginHorizontal: 4,
    opacity: 0.5,
  },
  activeDot: {
    backgroundColor: '#2d98da',
    width: Math.max(12, width * 0.03),
    height: Math.max(12, width * 0.03),
    borderRadius: Math.max(6, width * 0.015),
    opacity: 1,
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: width < 400 ? '100%' : '48%', // Full width on small screens
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: Math.max(15, width * 0.04),
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  featureIcon: {
    fontSize: Math.min(40, width * 0.1),
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: Math.min(16, width * 0.04),
    fontFamily: 'Sarabun_600SemiBold',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: Math.min(13, width * 0.035),
    fontFamily: 'Sarabun_400Regular',
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 18,
  },
  ctaSection: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  ctaTitle: {
    fontSize: Math.min(20, width * 0.05),
    fontFamily: 'Sarabun_600SemiBold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 28,
  },
  ctaButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    shadowColor: '#27ae60',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: Math.min(18, width * 0.045),
    fontFamily: 'Sarabun_600SemiBold',
  },
  footer: {
    backgroundColor: '#34495e',
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#ecf0f1',
    fontSize: 16,
    fontFamily: 'Sarabun_500Medium',
    marginBottom: 8,
  },
  footerSubText: {
    color: '#bdc3c7',
    fontSize: 14,
    fontFamily: 'Sarabun_400Regular',
  },
});