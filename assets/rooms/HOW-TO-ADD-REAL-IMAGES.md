# 🖼️ วิธีเพิ่มรูปภาพห้องจริง (แก้ไขใหม่)

## ❗ ข้อจำกัดของ React Native:
React Native ไม่รองรับ **dynamic require()** ดังนั้นต้องใช้ **static imports** เท่านั้น

## 🔧 วิธีเพิ่มรูปจริง:

### 1. เตรียมรูปภาพ
- วางรูปใน `assets/rooms/`
- ตั้งชื่อตาม pattern: `lab-room-1.jpg`, `classroom.jpg`, ฯลฯ

### 2. แก้ไขโค้ดใน RoomsScreen.js
ใน function `getRoomImage()` ให้:

#### 🔓 **เปิด comment block:**
```javascript
// ลบ /* และ */ ออก เพื่อเปิดใช้โค้ด
```

#### ✏️ **เพิ่มรูปใหม่:**
```javascript
// เพิ่มใน switch statement หรือ if condition
case 'ประเภทใหม่':
  return require('../assets/rooms/รูปใหม่.jpg');
```

## 📋 Template สำหรับเพิ่มรูปห้อง:

### ห้องแล็บ:
```javascript
if (type?.toLowerCase() === 'lab') {
  if (nameCheck.includes('1') || nameCheck.includes('biology')) {
    return require('../assets/rooms/lab-room-1.jpg');
  } else if (nameCheck.includes('2') || nameCheck.includes('chemistry')) {
    return require('../assets/rooms/lab-room-2.jpg');
  }
  return require('../assets/rooms/lab-room.jpg');
}
```

### ห้องเรียน:
```javascript
if (type?.toLowerCase() === 'classroom') {
  if (nameCheck.includes('1')) {
    return require('../assets/rooms/classroom-1.jpg');
  } else if (nameCheck.includes('2')) {
    return require('../assets/rooms/classroom-2.jpg');
  }
  return require('../assets/rooms/classroom.jpg');
}
```

### ห้องประชุม:
```javascript
if (type?.toLowerCase() === 'meeting') {
  if (nameCheck.includes('small') || nameCheck.includes('เล็ก')) {
    return require('../assets/rooms/meeting-room-small.jpg');
  } else if (nameCheck.includes('large') || nameCheck.includes('ใหญ่')) {
    return require('../assets/rooms/meeting-room-large.jpg');
  }
  return require('../assets/rooms/meeting-room.jpg');
}
```

## 🎯 ขั้นตอนทั้งหมด:

### 1. เพิ่มรูปภาพ
```
📁 assets/rooms/
  📄 lab-room-1.jpg
  📄 lab-room-2.jpg
  📄 classroom.jpg
  📄 meeting-room.jpg
  📄 default-room.jpg
```

### 2. แก้ไขโค้ด
- เปิดไฟล์ `screens/RoomsScreen.js`
- หา function `getRoomImage()`
- ลบ `/*` และ `*/` ออก
- เพิ่ม/แก้ไข case ตามต้องการ

### 3. ทดสอบ
- รีโหลดแอป
- ตรวจสอบว่ารูปแสดงถูกต้อง

## ⚠️ สิ่งสำคัญ:
1. **ใช้ static require เท่านั้น** - ไม่ใช้ dynamic path
2. **ตรวจสอบชื่อไฟล์** ให้ถูกต้องทุกตัวอักษร
3. **กรณีไม่มีรูป** - จะใช้ icon.png แทน
4. **ระวัง typo** - require แปลงที่ compile time

## 💡 Tips:
- เริ่มจากรูปง่ายๆ เช่น `default-room.jpg`
- ทดสอบทีละรูป เพื่อตรวจสอบ path
- ใช้ชื่อไฟล์สั้นๆ หลีกเลี่ยงอักขระพิเศษ
- สำรองโค้ดเดิมก่อนแก้ไข