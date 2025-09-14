import requests
import os

# Room images URLs from Unsplash (free, high quality)
images = {
    "default-room.jpg": "https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "classroom.jpg": "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "classroom-1.jpg": "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "classroom-2.jpg": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "lab-room.jpg": "https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "lab-room-1.jpg": "https://images.unsplash.com/photo-1567427018141-0584cfcbf1b8?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "lab-room-2.jpg": "https://images.unsplash.com/photo-1609780447353-8dd35a52b0ce?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "lab-room-3.jpg": "https://images.unsplash.com/photo-1603976272629-52aead1da10f?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "computer-lab.jpg": "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "meeting-room.jpg": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "meeting-room-small.jpg": "https://images.unsplash.com/photo-1560439514-4e9645039924?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "meeting-room-large.jpg": "https://images.unsplash.com/photo-1519852476561-ec618b0183ba?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "conference-room.jpg": "https://images.unsplash.com/photo-1505664063556-eef5e1d9e3b9?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "music-room.jpg": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "music-room-1.jpg": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "music-room-2.jpg": "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "art-room.jpg": "https://images.unsplash.com/photo-1545130865-7b2d73e8e9c4?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "art-room-1.jpg": "https://images.unsplash.com/photo-1572177812156-58036aae439c?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "art-room-2.jpg": "https://images.unsplash.com/photo-1504197832061-98356e3dcdcf?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "gym-room.jpg": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "library-room.jpg": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "science-room.jpg": "https://images.unsplash.com/photo-1581069700310-2d34d2a34561?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "studio-room.jpg": "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    "theater-room.jpg": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=center&auto=format&q=80"
}

def download_images():
    print("📸 Starting to download room images...")
    
    for filename, url in images.items():
        try:
            print(f"⬇️  Downloading {filename}...")
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            with open(filename, 'wb') as f:
                f.write(response.content)
            
            print(f"✅ {filename} downloaded successfully")
            
        except Exception as e:
            print(f"❌ Failed to download {filename}: {str(e)}")
    
    print("🎉 All downloads completed!")

if __name__ == "__main__":
    download_images()