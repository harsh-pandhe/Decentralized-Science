import { ReactNode } from "react";

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <div className="bg-white dark:bg-gray-700 rounded-xl shadow-md p-6 transition hover:shadow-lg">
      <div className="bg-primary bg-opacity-10 dark:bg-opacity-20 rounded-full w-12 h-12 flex items-center justify-center mb-4">
        <span className="material-icons text-primary">{icon}</span>
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
};

export default FeatureCard;
