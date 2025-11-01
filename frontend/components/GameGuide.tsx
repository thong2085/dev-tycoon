export default function GameGuide() {
  return (
    <div className="hidden lg:flex flex-1 bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-gray-900/50 p-8 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <span className="text-5xl">📚</span>
            <span>Game Guide</span>
          </h2>
          <p className="text-purple-200 text-lg">Welcome to Dev Tycoon! Learn how to become a successful tech entrepreneur.</p>
        </div>

        {/* Game Overview */}
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 mb-6 border border-purple-500/30 shadow-lg">
          <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-3xl">🎮</span>
            What is Dev Tycoon?
          </h3>
          <p className="text-gray-300 leading-relaxed mb-4">
            Dev Tycoon is an incremental/idle game where you start as a freelancer and grow into a tech tycoon. 
            Manage projects, hire employees, launch products, and build your empire!
          </p>
        </div>

        {/* How to Play */}
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 mb-6 border border-blue-500/30 shadow-lg">
          <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-3xl">🎯</span>
            How to Play
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-purple-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">Start Clicking</h4>
                <p className="text-gray-300 text-sm">Click to earn money and upgrade your click power!</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-blue-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">Level Up</h4>
                <p className="text-gray-300 text-sm">Earn XP to unlock new features and abilities.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-green-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">Create Company</h4>
                <p className="text-gray-300 text-sm">Start your startup at Company Level 2 to hire employees.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-yellow-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                4
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">Complete Projects</h4>
                <p className="text-gray-300 text-sm">Accept jobs from the job board, assign employees, and claim rewards!</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-red-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                5
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">Launch Products</h4>
                <p className="text-gray-300 text-sm">Turn completed projects into passive revenue streams.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Game Loop */}
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 mb-6 border border-green-500/30 shadow-lg">
          <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-3xl">🔄</span>
            Game Progression
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-700/50 to-transparent rounded-lg border-l-4 border-green-500">
              <span className="text-2xl">👤</span>
              <div>
                <p className="font-bold text-white">Freelancer (Level 1-2)</p>
                <p className="text-sm text-gray-300">Click to earn money, unlock skills, complete projects</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-700/50 to-transparent rounded-lg border-l-4 border-blue-500">
              <span className="text-2xl">🏢</span>
              <div>
                <p className="font-bold text-white">Startup (Level 3+)</p>
                <p className="text-sm text-gray-300">Hire employees, manage team, optimize workflows</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-700/50 to-transparent rounded-lg border-l-4 border-purple-500">
              <span className="text-2xl">🚀</span>
              <div>
                <p className="font-bold text-white">Tech Giant (Level 5+)</p>
                <p className="text-sm text-gray-300">Launch products, research tech, dominate market</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-700/50 to-transparent rounded-lg border-l-4 border-yellow-500">
              <span className="text-2xl">⭐</span>
              <div>
                <p className="font-bold text-white">AI Powerhouse (Level 8+)</p>
                <p className="text-sm text-gray-300">Unlock AI features: NPC chat, auto mentor, quests</p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 mb-6 border border-yellow-500/30 shadow-lg">
          <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-3xl">✨</span>
            Key Features
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-2 bg-gray-700/30 rounded-lg">
              <span className="text-lg">📋</span>
              <span className="text-sm text-gray-200">Projects</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-700/30 rounded-lg">
              <span className="text-lg">👥</span>
              <span className="text-sm text-gray-200">Employees</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-700/30 rounded-lg">
              <span className="text-lg">🚀</span>
              <span className="text-sm text-gray-200">Products</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-700/30 rounded-lg">
              <span className="text-lg">🔬</span>
              <span className="text-sm text-gray-200">Research</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-700/30 rounded-lg">
              <span className="text-lg">🤖</span>
              <span className="text-sm text-gray-200">AI NPCs</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-700/30 rounded-lg">
              <span className="text-lg">🎯</span>
              <span className="text-sm text-gray-200">Quests</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-700/30 rounded-lg">
              <span className="text-lg">🏆</span>
              <span className="text-sm text-gray-200">Achievements</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-700/30 rounded-lg">
              <span className="text-lg">👑</span>
              <span className="text-sm text-gray-200">Prestige</span>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-sm rounded-xl p-6 border border-purple-500/50 shadow-lg">
          <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-3xl">💡</span>
            Pro Tips
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-yellow-400 text-xl">💰</span>
              <span className="text-gray-200">Balance income vs costs - hire smart, avoid bankruptcy!</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-yellow-400 text-xl">⏰</span>
              <span className="text-gray-200">Watch deadlines! Failed projects hurt your reputation.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-yellow-400 text-xl">🎯</span>
              <span className="text-gray-200">Complete quests from NPCs for extra rewards and reputation.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-yellow-400 text-xl">🚀</span>
              <span className="text-gray-200">Products generate passive income - launch more to grow faster!</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-yellow-400 text-xl">🧠</span>
              <span className="text-gray-200">Research upgrades boost all your company operations.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-yellow-400 text-xl">👑</span>
              <span className="text-gray-200">Prestige to reset with permanent bonuses for faster progress!</span>
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Ready to become a Dev Tycoon? Log in or register to start your journey! 🚀
          </p>
        </div>
      </div>
    </div>
  );
}

