const NoResults = ({
  message = "No items found",
  description = "Try adjusting your search or add a new item to get started.",
}) => {
  return (
    <div className="text-center py-20">
      <div className="text-gray-400 text-6xl mb-4">🔍</div>
      <h3 className="text-xl font-semibold text-white mb-2">{message}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
};

export default NoResults;
