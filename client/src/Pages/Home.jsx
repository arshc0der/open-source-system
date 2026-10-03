import { Link } from "react-router-dom";
import { FiTerminal, FiGitBranch, FiGitCommit, FiActivity, FiTarget } from "../Component/icons.js";

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center flex flex-col justify-center items-center">
      <div className="inline-block mb-8 px-4 py-1.5 border border-neutral-700 bg-neutral-900/50 text-neutral-300 text-xs font-mono uppercase tracking-widest">
        Open source for everyone
      </div>

      <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight uppercase text-white">
        Share and manage <br className="hidden md:block" />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-white">
          your code
        </span>
      </h1>

      <p className="mt-6 max-w-2xl text-lg text-neutral-400 mx-auto mb-12 font-light">
        Create repositories, work on branches, and team up with others. Simple version control for your projects.
      </p>

      <div className="flex flex-col sm:flex-row justify-center gap-4 w-full max-w-md mx-auto">
        <Link to="/register" className="flex-1 bg-white text-black px-8 py-4 rounded-sm text-sm font-bold uppercase tracking-widest hover:bg-neutral-200 flex items-center justify-center gap-2">
          <FiTerminal className="w-4 h-4" /> Register
        </Link>
        <Link to="/explore" className="flex-1 bg-transparent border border-neutral-600 text-white px-8 py-4 rounded-sm text-sm font-bold uppercase tracking-widest hover:border-white hover:bg-neutral-900 flex items-center justify-center gap-2">
          <FiTarget className="w-4 h-4" /> Explore
        </Link>
      </div>

      <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full border-t border-neutral-800 pt-16">
        {[
          { title: "Safe commits", desc: "Save your work with commits so you can always go back to an earlier version.", icon: <FiGitCommit className="w-5 h-5 text-white" /> },
          { title: "Easy branches", desc: "Try new ideas on a branch, then merge them when they are ready.", icon: <FiGitBranch className="w-5 h-5 text-white" /> },
          { title: "Work together", desc: "Share repositories and work with your team in one place.", icon: <FiActivity className="w-5 h-5 text-white" /> },
        ].map((feature) => (
          <div key={feature.title} className="p-8 border border-neutral-800 bg-neutral-950/50 hover:bg-neutral-900 transition-colors group">
            <div className="w-10 h-10 mb-6 bg-neutral-900 border border-neutral-700 flex items-center justify-center group-hover:border-white">
              {feature.icon}
            </div>
            <h3 className="text-lg font-bold mb-3 text-white uppercase tracking-wider">{feature.title}</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
