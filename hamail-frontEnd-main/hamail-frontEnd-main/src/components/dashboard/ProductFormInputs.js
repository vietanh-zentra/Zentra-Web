import React from "react";

const ProductFormInputs = ({ editedProduct, setEditedProduct }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input
          type="text"
          value={editedProduct.title}
          onChange={(e) =>
            setEditedProduct({
              ...editedProduct,
              title: e.target.value,
            })
          }
          className="w-full p-2 border rounded bg-gray-800 border-gray-700"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={editedProduct.description}
          onChange={(e) =>
            setEditedProduct({
              ...editedProduct,
              description: e.target.value,
            })
          }
          className="w-full p-2 border rounded bg-gray-800 border-gray-700 h-32"
          style={{ whiteSpace: "pre-wrap" }}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Price</label>
        <input
          type="number"
          value={editedProduct.price}
          onChange={(e) =>
            setEditedProduct({
              ...editedProduct,
              price: e.target.value,
            })
          }
          className="w-full p-2 border rounded bg-gray-800 border-gray-700"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Materials</label>
        <input
          type="text"
          value={editedProduct.materials}
          onChange={(e) =>
            setEditedProduct({
              ...editedProduct,
              materials: e.target.value,
            })
          }
          className="w-full p-2 border rounded bg-gray-800 border-gray-700"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          Healing Intention
        </label>
        <input
          type="text"
          value={editedProduct.healing_intention}
          onChange={(e) =>
            setEditedProduct({
              ...editedProduct,
              healing_intention: e.target.value,
            })
          }
          className="w-full p-2 border rounded bg-gray-800 border-gray-700"
        />
      </div>
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={editedProduct.is_sold_out}
            onChange={(e) =>
              setEditedProduct({
                ...editedProduct,
                is_sold_out: e.target.checked,
              })
            }
            className="rounded bg-gray-800 border-gray-700"
          />
          <span>Sold Out</span>
        </label>
      </div>
    </div>
  );
};

export default ProductFormInputs;
