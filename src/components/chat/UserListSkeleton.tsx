// src/components/UserListSkeleton.tsx
export default function UserListSkeleton() {
  return (
    <div className="w-full h-full border-r border-gray-200 bg-white p-4">
      <div className="h-8 w-3/4 bg-gray-200 rounded-md mb-6 animate-pulse"></div>
      <ul>
        {Array.from({ length: 8 }).map((_, index) => (
          <li key={index} className="flex items-center space-x-3 py-3 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1 h-4 bg-gray-200 rounded-md"></div>
          </li>
        ))}
      </ul>
    </div>
  );
}