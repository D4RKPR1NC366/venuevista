import React, { useEffect, useState, useRef } from "react";
import Sidebar from "./Sidebar";
import "./goldustgallery.css";

const API_BASE = "/api";

const GoldustGallery = () => {
  const [images, setImages] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchImages();
  }, []);

  async function fetchImages() {
    try {
      const res = await fetch(`${API_BASE}/gallery`);
      const data = await res.json();
      setImages(Array.isArray(data) ? data : []);
    } catch {
      setImages([]);
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError("");
      convertAndUpload(file);
    }
  };

  const convertAndUpload = (file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      handleUpload(base64, file.name);
    };
    reader.onerror = () => {
      setError("Failed to read file.");
    };
    reader.readAsDataURL(file);
  };

  const handleAddPictureClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
      fileInputRef.current.click();
    }
  };

  const handleUpload = async (base64, name) => {
    if (!base64 || !name) {
      setError("Please select a file.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/gallery/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ image: base64, name }),
      });
      if (!res.ok) throw new Error("Upload failed");
      setSelectedFile(null);
      fetchImages();
    } catch (err) {
      setError("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this image?")) return;
    try {
      const res = await fetch(`${API_BASE}/gallery/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      fetchImages();
    } catch {
      setError("Failed to delete image.");
    }
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div className="gallery-admin-page">
        <div className="gallery-admin-title-row">
          <h2 className="gallery-admin-title">Goldust Gallery Admin</h2>
        </div>
        <div style={{ textAlign: "center" }}>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <button
            type="button"
            className="gallery-admin-add-btn"
            onClick={handleAddPictureClick}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Add Picture"}
          </button>
          {error && <div className="gallery-admin-error">{error}</div>}
        </div>
        <div className="gallery-grid">
          {images.length === 0 ? (
            <div className="gallery-admin-empty">No images yet.</div>
          ) : (
            images.map(img => (
              <div className="gallery-card" key={img._id || img.url}>
                <img src={img.url} alt={img.name || "Gallery"} />
                <button className="gallery-card-delete" onClick={() => handleDelete(img._id)}>✕</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default GoldustGallery;
