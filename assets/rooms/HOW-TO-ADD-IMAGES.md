# 📸 วิธีการเพิ่มรูปภาพห้องจริง

## 🎯 ขั้นตอนการเพิ่มรูปภาพ:

### 1. เตรียมรูปภาพ
- ถ่ายรูปห้องจริงหรือหารูปที่เหมาะสม
- ปรับขนาด: **400x300 pixels** หรือใหญ่กว่า
- รูปแบบ: **JPG** หรือ **PNG**
- ขนาดไฟล์: ไม่เกิน **500KB**

### 2. ชื่อไฟล์รูปภาพที่ต้องการ:

#### ห้องทั่วไป:
- `default-room.jpg` - ห้องทั่วไป
- `classroom.jpg` - ห้องเรียนหลัก
- `classroom-1.jpg` - ห้องเรียน A/1
- `classroom-2.jpg` - ห้องเรียน B/2  
- `classroom-3.jpg` - ห้องเรียน C/3

#### ห้องแล็บ (หลายห้อง):
- `lab-room.jpg` - ห้องแล็บหลัก
- `lab-room-1.jpg` - ห้องแล็บ 1/A/Biology
- `lab-room-2.jpg` - ห้องแล็บ 2/B/Chemistry
- `lab-room-3.jpg` - ห้องแล็บ 3/C/Physics
- `computer-lab.jpg` - ห้องแล็บคอมพิวเตอร์

#### ห้องประชุม:
- `meeting-room.jpg` - ห้องประชุมหลัก
- `meeting-room-small.jpg` - ห้องประชุมเล็ก/1
- `meeting-room-large.jpg` - ห้องประชุมใหญ่/2
- `conference-room.jpg` - ห้องประชุมใหญ่
- `computer-room.jpg` - ห้องคอมพิวเตอร์
- `library-room.jpg` - ห้องสมุด

#### ห้องพิเศษ (หลายห้อง):
- `music-room.jpg` - ห้องดนตรีหลัก
- `music-room-1.jpg` - ห้องดนตรี 1/A
- `music-room-2.jpg` - ห้องดนตรี 2/B
- `art-room.jpg` - ห้องศิลปะหลัก
- `art-room-1.jpg` - ห้องศิลปะ 1/A
- `art-room-2.jpg` - ห้องศิลปะ 2/B
- `science-room.jpg` - ห้องวิทยาศาสตร์
- `gym-room.jpg` - ห้องออกกำลังกาย
- `studio-room.jpg` - สตูดิโอ
- `theater-room.jpg` - โรงละคร

### 3. วางไฟล์ในโฟลเดอร์
```
📁 assets/
  📁 rooms/
    📄 default-room.jpg
    📄 classroom.jpg
    📄 lab-room.jpg
    📄 ... (รูปอื่นๆ)
```

### 4. อัปเดตโค้ด (ถ้าต้องการ)
หากต้องการเพิ่มประเภทห้องใหม่ ให้แก้ไขใน `RoomsScreen.js`:

```javascript
// เพิ่มใน getRoomImage function
case 'ประเภทใหม่':
  return require('../assets/rooms/รูปใหม่.jpg');
```

## ⚡ การทำงานปัจจุบัน:
- ✅ **แอปทำงานได้ปกติ** - ไม่มี Error
- 🖼️ ใช้รูป **icon.png** สำหรับทุกห้อง (ชั่วคราว)
- 🎨 แต่ละห้องมี **สีพื้นหลัง** และ **ไอคอน** ที่แตกต่างกัน
- 🏢 **รองรับหลายห้องในประเภทเดียวกัน** - เช่น Lab 1, Lab 2, Lab 3
- 🔧 ระบบจะเลือกรูปตาม **ชื่อห้อง** และ **ประเภท**

## ❗ ข้อจำกัด React Native:
- 🚫 **ไม่รองรับ dynamic require()** 
- ✅ **ต้องใช้ static imports** เท่านั้น
- 📝 **ต้องแก้โค้ด** เมื่อเพิ่มรูปใหม่

## 🔧 เมื่อพร้อมเพิ่มรูปจริง:
1. 📁 **วางรูปใน** `assets/rooms/`  
2. ✏️ **แก้โค้ดใน** `RoomsScreen.js`  
3. 🔓 **เปิด comment block** ในฟังก์ชัน `getRoomImage()`
4. ✅ **ทดสอบแอป** - รีโหลดและตรวจสอบ

📖 **ดูคำแนะนำเพิ่มเติม:** `HOW-TO-ADD-REAL-IMAGES.md`

## 🎯 ตัวอย่างการทำงาน:
### ห้องแล็บ:
- **"Lab Room 1"** → `lab-room-1.jpg`
- **"Lab Room A"** → `lab-room-1.jpg`  
- **"Biology Lab"** → `lab-room-1.jpg`
- **"Chemistry Lab"** → `lab-room-2.jpg`
- **"Physics Lab"** → `lab-room-3.jpg`
- **"Computer Lab"** → `computer-lab.jpg`

### ห้องเรียน:
- **"Classroom 1"** → `classroom-1.jpg`
- **"Classroom A"** → `classroom-1.jpg`
- **"Classroom 2"** → `classroom-2.jpg`

### ห้องดนตรี:
- **"Music Room 1"** → `music-room-1.jpg`
- **"Music Studio A"** → `music-room-1.jpg`
- **"Music Room 2"** → `music-room-2.jpg`

## 🔧 Tips:
- หารูปจาก [Unsplash](https://unsplash.com) สำหรับรูปห้องสวยๆ
- ใช้ [TinyPNG](https://tinypng.com) เพื่อลดขนาดไฟล์
- ตั้งชื่อไฟล์ให้ตรงตาม list ข้างบน