import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image } from 'react-native';

export default function RoomsScreen() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5001/api/rooms')
      .then((res) => res.json())
      .then((data) => {
        setRooms(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {/* ตัวอย่างรูปภาพ สามารถเปลี่ยน url ได้ */}
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
      <FlatList
        data={rooms}
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
});