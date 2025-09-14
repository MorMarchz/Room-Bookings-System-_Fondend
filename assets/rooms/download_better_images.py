import requests
import os

# Updated room images URLs - consistent style from Unsplash (modern, bright, consistent tone)
images = {
    # Default and Basic Rooms - Clean, modern style
    "default-room.jpg": "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    
    # Classrooms - Bright, modern educational spaces
    "classroom.jpg": "https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "classroom-1.jpg": "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "classroom-2.jpg": "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "classroom-3.jpg": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    
    # Labs - Clean, professional laboratory spaces
    "lab-room.jpg": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "lab-room-1.jpg": "https://images.unsplash.com/photo-1567427018141-0584cfcbf1b8?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "lab-room-2.jpg": "https://images.unsplash.com/photo-1580281658626-ee379f3cce93?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "lab-room-3.jpg": "https://images.unsplash.com/photo-1626385280906-63b4b53d6bda?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "computer-lab.jpg": "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    
    # Meeting Rooms - Professional, clean meeting spaces
    "meeting-room.jpg": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "meeting-room-small.jpg": "https://images.unsplash.com/photo-1560439514-4e9645039924?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "meeting-room-large.jpg": "https://images.unsplash.com/photo-1519852476561-ec618b0183ba?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "conference-room.jpg": "https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "seminar-room.jpg": "https://images.unsplash.com/photo-1505664063556-eef5e1d9e3b9?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    
    # Creative Spaces - Bright, inspiring creative environments
    "music-room.jpg": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "music-room-1.jpg": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "music-room-2.jpg": "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "art-room.jpg": "https://images.unsplash.com/photo-1572177812156-58036aae439c?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "art-room-1.jpg": "https://images.unsplash.com/photo-1504197832061-98356e3dcdcf?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "art-room-2.jpg": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "studio-room.jpg": "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    
    # Activity Spaces - Clean, modern activity areas
    "gym-room.jpg": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "library-room.jpg": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "theater-room.jpg": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "auditorium-room.jpg": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    
    # Training & Workshop - Professional learning environments
    "workshop-room.jpg": "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "training-room.jpg": "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "science-room.jpg": "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
}

def download_new_images():
    print("🎨 Downloading new consistent room images...")
    success_count = 0
    fail_count = 0
    
    for filename, url in images.items():
        try:
            print(f"⬇️  Downloading {filename}...")
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            # Backup old file if exists
            if os.path.exists(filename):
                backup_name = f"{filename}.backup"
                os.rename(filename, backup_name)
                print(f"📦 Backed up old {filename}")
            
            with open(filename, 'wb') as f:
                f.write(response.content)
            
            print(f"✅ {filename} downloaded successfully")
            success_count += 1
            
        except Exception as e:
            print(f"❌ Failed to download {filename}: {str(e)}")
            fail_count += 1
            
            # Restore backup if download failed
            backup_name = f"{filename}.backup"
            if os.path.exists(backup_name):
                os.rename(backup_name, filename)
                print(f"🔄 Restored backup for {filename}")
    
    print(f"\n🎉 Download completed!")
    print(f"✅ Success: {success_count} files")
    print(f"❌ Failed: {fail_count} files")

if __name__ == "__main__":
    download_new_images()