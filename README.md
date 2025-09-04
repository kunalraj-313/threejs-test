# 🚀 Three.js Spaceship Game

A professional 3D space shooter game built with React Three Fiber featuring realistic spaceship combat, leaderboards, and immersive audio experience.

## 🎮 Game Instructions

### 🎯 Objective
🛸 Survive as long as possible while avoiding obstacles and shooting enemies! Climb the leaderboard and become the ultimate space pilot!

### 🕹️ Controls
- **🟢 Start:** `Click on Start Game` (Music starts automatically)
- **🚀 Movement:** `WASD` or `Arrow Keys` 
- **🔫 Shooting:** 
  - `Left Click` - Single shot
  - `Hold Left Mouse` - Rapid fire
  - `Spacebar` - Single shot  
  - `Hold Spacebar` - Rapid fire
- **⏸️ Pause/Resume:** `ESC` key (pauses game and music)
- **🔄 Restart:** `Click on Game Over screen`

### 🎲 Gameplay Mechanics
- 🛸 **Ship Movement:** Navigate your spaceship in 3D space with realistic tilting
- 🎯 **Boundaries:** Stay within the play area (-10 to +10 horizontal, -3 to +3 vertical)
- 🔴 **Obstacles:** Red spheres with 20 HP spawn in random waves
- 💚 **Projectiles:** Green bullets deal 5 damage per hit with laser sound effects
- ❤️ **Health System:** Ship has 100 HP, loses HP when colliding with obstacles
- 💥 **Collision Damage:** Ship takes damage equal to obstacle's remaining HP
- 🔊 **Audio Feedback:** Damage sounds when hit, shooting sounds when firing

### 📊 Scoring System
- ⏱️ **Survival Time:** +1 point every second (stops when game ends)
- 🎯 **Hit Bonus:** +5 points per projectile hit on obstacles
- 🏆 **Final Score:** Based on survival time and accuracy
- 📈 **Difficulty Scaling:** Game speed increases every 200 points

### 🏆 Leaderboard System
- 📋 **Global Leaderboard:** Top 10 players displayed
- 💾 **Score Saving:** Enter your name to save high scores
- 🛡️ **Profanity Filter:** Automatic name filtering for clean leaderboards
- 🔄 **Real-time Updates:** Leaderboard updates instantly after each game

### 🎵 Audio Features
- 🎶 **Background Music:** Immersive space soundtrack that starts with the game
- 🔊 **Sound Effects:** 
  - Laser shooting sounds with proper throttling
  - Damage impact sounds when taking hits
  - Volume-controlled audio system
- 🔇 **Audio Controls:**
  - Mute/unmute toggle
  - Volume slider (0-100%)
  - All sounds respect mute settings
- ⏸️ **Smart Audio:** 
  - Music pauses with game pause (ESC)
  - All sounds stop immediately on game over
  - No audio loops or memory leaks

### 🌟 Visual Features
- 🚀 **3D Spaceship Model:** Professional spaceship with materials and textures
- ⭐ **Dynamic Star Field:** Moving star field background for space immersion
- 🎯 **Visual Projectiles:** 3D projectiles with realistic physics
- 🧱 **Obstacle Variety:** Multiple colored obstacles with collision detection
- ❤️ **Health System:** Visual health indicator (3 lives)
- 🎨 **Professional UI:**
  - Gradient backgrounds and hover effects
  - Game state screens (start, pause, game over)
  - Animated buttons and smooth transitions
  - Responsive design for different screen sizes
- 🔄 **Ship Tilting:** Realistic movement animations  
- 🌈 **Health Bar:** Color-coded HP display (Green → Yellow → Red)
- 📈 **Difficulty Scaling:** Visual speed increases every 200 points

### 🛠️ Technical Features
- ⚛️ **React Three Fiber:** Modern Three.js integration with React
- 🌐 **Supabase Database:** Cloud database for persistent leaderboards
- 🎧 **Web Audio API:** Advanced audio system with oscillator-based sound effects
- 📱 **Responsive Design:** Works on desktop and mobile devices
- ⚡ **Performance Optimized:** 60 FPS gameplay with efficient collision detection
- 🧹 **Memory Management:** Proper cleanup of audio resources and game objects

### 💡 Pro Tips
- 🎯 **Accuracy Matters:** Hit obstacles with projectiles for bonus points
- 🚀 **Movement Strategy:** Use smooth movements to avoid obstacles while maintaining shooting accuracy
- ⏸️ **Use Pause:** Press ESC to pause and plan your next move
- 🔊 **Audio Cues:** Sound effects help indicate successful hits and damage
- 🏆 **Leaderboard Glory:** Survive longer and hit more targets to climb the rankings
- ⚡ **Speed Scaling:** Game gets faster every 200 points - prepare for increased challenge!
- 💪 **Survival:** Keep moving to avoid getting overwhelmed
- 🎯 **Each Hit Counts:** Every projectile hit contributes to both obstacle damage and your score

### ⚰️ Game Over Conditions
- 💔 **Health Depletion:** Game ends when health reaches 0 (3 hits from obstacles)
- 🛑 **Collision System:** Direct contact with obstacles causes damage
- 🎯 **No Respawning:** Each game session requires fresh start after game over
- 📊 **Score Finalization:** Final score calculated and eligible for leaderboard entry

## 🚀 Ready to Play?
Launch the game and test your piloting skills! 🛸✨

## 🛠️ Development Setup
```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to play the game!