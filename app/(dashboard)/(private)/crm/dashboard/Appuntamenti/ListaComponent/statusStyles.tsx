import { CheckCircle, Clock, XCircle } from "lucide-react";

interface StatusStyle {
  color: string;
  textColor: string;
  icon: JSX.Element;
}

export const statusStyles: Record<string, StatusStyle> = {
  "Da Fare": {
    color: "bg-gray-100",
    textColor: "text-gray-700",
    icon: <Clock className="w-4 h-4" />,
  },
  "In Preparazione": {
    color: "bg-orange-100",
    textColor: "text-orange-700",
    icon: <Clock className="w-4 h-4" />,
  },
  Pronti: {
    color: "bg-yellow-100",
    textColor: "text-yellow-700",
    icon: <Clock className="w-4 h-4" />,
  },
  Consegnato: {
    color: "bg-green-100",
    textColor: "text-green-700",
    icon: <CheckCircle className="w-4 h-4" />,
  },
  "In Ritardo": {
    color: "bg-red-100",
    textColor: "text-red-700",
    icon: <XCircle className="w-4 h-4" />,
  },
  Default: {
    color: "bg-gray-100",
    textColor: "text-gray-700",
    icon: <Clock className="w-4 h-4" />,
  },
};
