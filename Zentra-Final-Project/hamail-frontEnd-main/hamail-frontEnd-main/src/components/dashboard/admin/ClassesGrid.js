"use client";

import Image from "next/image";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import Button from "@/components/Button";

const ClassesGrid = ({ classes, onEdit, onDelete }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {classes.map((classItem) => (
        <div
          key={classItem.id}
          className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors"
        >
          {/* Class Image */}
          <div className="relative h-48 bg-gray-700">
            <Image
              src={classItem.image}
              alt={classItem.title}
              fill
              className="object-cover"
            />
            <div className="absolute top-3 left-3">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  classItem.class_type === "online"
                    ? "bg-blue-500 text-white"
                    : "bg-green-500 text-white"
                }`}
              >
                {classItem.class_type === "online" ? "Online" : "In-Person"}
              </span>
            </div>
          </div>

          {/* Class Details */}
          <div className="p-4">
            <h3 className="text-lg font-semibold text-white mb-2">
              {classItem.title}
            </h3>

            <p className="text-gray-300 text-sm mb-3 line-clamp-2">
              {classItem.description}
            </p>

            {/* Schedule Info */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center text-sm text-gray-400">
                <span className="w-16 text-gray-500 mr-4">Day:</span>
                <span className="text-white">{classItem.day}</span>
              </div>
              <div className="flex items-center text-sm text-gray-400">
                <span className="w-16 text-gray-500 mr-4">Time:</span>
                <span className="text-white">{classItem.time}</span>
              </div>
              <div className="flex items-center text-sm text-gray-400 mb-4">
                <span className="w-16 text-gray-500 mr-4">Location:</span>
                <span className="text-white">{classItem.location}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => onEdit(classItem)}
                variant="secondary"
                className="flex-1 flex items-center justify-center"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                onClick={() => onDelete(classItem.id)}
                variant="danger"
                className="flex-1 flex items-center justify-center"
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ClassesGrid;
