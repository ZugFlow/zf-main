import React from "react";

interface ProjectCardProps {
  title: string;
  projectName: string;
  dueDate: string;
  completion: number; // Percentuale di completamento (0-100)
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  title,
  projectName,
  dueDate,
  completion,
}) => {
  return (
    <div className="relative w-full max-w-md">
      {/* Contenitore SVG per la forma personalizzata */}
      <svg
        viewBox="0 0 400 150"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute w-full h-full"
        preserveAspectRatio="none"
      >
        <path
          d="M0,0 h350 q30,0 30,30 v90 q0,30 -30,30 h-350 z"
          fill="#FDE047"
        />
      </svg>
      {/* Contenuto sopra il rettangolo */}
      <div className="relative p-4">
        <div className="flex items-center justify-between">
          {/* Cerchio */}
          <div className="w-4 h-4 border-2 border-black rounded-full flex-shrink-0"></div>
          {/* Linea tratteggiata */}
          <div className="flex-grow flex justify-end pr-4">
            <div className="h-1 w-16 border-dotted border-2 border-black"></div>
          </div>
        </div>
        {/* Titolo */}
        <h2 className="font-bold text-lg text-black mt-2">{title}</h2>
        {/* Sottotitolo */}
        <p className="text-sm text-gray-800 mt-1">{projectName}</p>
        {/* Data di scadenza */}
        <p className="text-sm text-gray-700 mt-1 flex items-center">
          <span className="material-icons text-sm mr-1">calendar_today</span>
          Due date: {dueDate}
        </p>
        {/* Barra di completamento */}
        <div className="mt-4">
          <div className="relative w-full h-2 bg-black rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-yellow-400"
              style={{ width: `${completion}%` }}
            ></div>
          </div>
          <p className="mt-2 text-sm font-medium text-black">{completion}% Completed</p>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
