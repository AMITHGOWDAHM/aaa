import React, { useState } from 'react';
import Papa from 'papaparse';
import { createClient } from '@supabase/supabase-js';

// Supabase client - keep same as your other files or export from a central place
const supabaseUrl = "https://slvtkdnrydybeebbcfcz.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdnRrZG5yeWR5YmVlYmJjZmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MTgzOTIsImV4cCI6MjA4MDA5NDM5Mn0.dWGWBkWrg8GMCGiCnhK3K81w7M65y6u2dbDPXlLAqH8";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function inferType(values) {
  // Simple type inference for a column's sample values
  if (values.every(v => !isNaN(parseFloat(v)) && isFinite(v))) return "float";
  if (values.every(v => /^\d{4}-\d{2}-\d{2}/.test(v))) return "date";
  if (values.every(v => v.toLowerCase() === 'true' || v.toLowerCase() === 'false')) return "boolean";
  return "string";
}

const DatasetUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
  };

  const handleUpload = () => {
    if (!file) return setMessage('Please select a CSV file.');

    setUploading(true);

    Papa.parse(file, {
      header: true,
      preview: 10, // parse first 10 rows for better type inference
      complete: async (results) => {
        const data = results.data;
        const fields = results.meta.fields;

        // Infer schema with basic logic (using first 10 rows)
        const schema = fields.map(field => {
          const sampleValues = data.slice(0, 10).map(row => row[field]);
          return {
            field,
            type: inferType(sampleValues),
            description: "" // You can ask user later for descriptions or leave empty
          };
        });

        // Preview first 5 rows only
        const preview = data.slice(0, 5);

        // Upload file to Supabase Storage
        const filePath = `datasets/${Date.now()}_${file.name}`;
        const { error: storageError } = await supabase.storage
          .from('datasets')
          .upload(filePath, file);

        if (storageError) {
          setUploading(false);
          setMessage('Error uploading file: ' + storageError.message);
          return;
        }

        // Get public URL for the file
        const { data: publicUrlData } = supabase.storage
          .from('datasets')
          .getPublicUrl(filePath);

        // Insert dataset record with schema and preview
        const { error: insertError } = await supabase.from('datasets').insert([{
          name: file.name,
          description: '',
          price: 0, // or get from input
          category: '',
          tags: [],
          ipfs_hash: publicUrlData.publicUrl, // Or actual IPFS hash if used
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          uploader_address: 'anonymous', // replace with actual user wallet address if you have
          schema_json: schema,
          preview_json: preview
        }]);

        if (insertError) {
          setUploading(false);
          setMessage('Error saving dataset metadata: ' + insertError.message);
          return;
        }

        setUploading(false);
        setMessage('Dataset uploaded successfully!');
        setFile(null);
      }
    });
  };

  return (
    <div>
      <h2>Upload Dataset (CSV)</h2>
      <input type="file" accept=".csv" onChange={handleFileChange} />
      <button disabled={uploading} onClick={handleUpload}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default DatasetUpload;
