import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, Modal } from 'react-native';

export default function RoomsScreen() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // filter state
  const [filterVisible, setFilterVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetch('http://localhost:5001/api/rooms')
      .then((res) => res.json())
      .then((data) => {
        setRooms(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ฟิลเตอร์ข้อมูล
  const filteredRooms = rooms.filter((room) => {
    let statusOk = statusFilter === 'all' || room.status === statusFilter;
    let typeOk = typeFilter === 'all' || room.type === typeFilter;
    return statusOk && typeOk;
  });

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
});