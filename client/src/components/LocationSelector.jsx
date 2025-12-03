import React, { useState, useEffect } from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const LocationSelector = ({ value, onChange, disabled = false }) => {
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  // Fetch provinces on mount
  useEffect(() => {
    fetch('https://psgc.gitlab.io/api/provinces/')
      .then(res => res.json())
      .then(data => {
        // Sort alphabetically by name
        const sortedProvinces = data.sort((a, b) => a.name.localeCompare(b.name));
        setProvinces(sortedProvinces);
      })
      .catch(err => console.error('Failed to fetch provinces:', err));
  }, []);

  // Fetch cities when province changes
  useEffect(() => {
    if (value?.province) {
      const selectedProvince = provinces.find(p => p.name === value.province);
      if (selectedProvince) {
        fetch(`https://psgc.gitlab.io/api/provinces/${selectedProvince.code}/cities-municipalities/`)
          .then(res => res.json())
          .then(data => {
            const sortedCities = data.sort((a, b) => a.name.localeCompare(b.name));
            setCities(sortedCities);
          })
          .catch(err => console.error('Failed to fetch cities:', err));
      }
    } else {
      setCities([]);
      setBarangays([]);
    }
  }, [value?.province, provinces]);

  // Fetch barangays when city changes
  useEffect(() => {
    if (value?.city) {
      const selectedCity = cities.find(c => c.name === value.city);
      if (selectedCity) {
        fetch(`https://psgc.gitlab.io/api/cities-municipalities/${selectedCity.code}/barangays/`)
          .then(res => res.json())
          .then(data => {
            const sortedBarangays = data.sort((a, b) => a.name.localeCompare(b.name));
            setBarangays(sortedBarangays);
          })
          .catch(err => console.error('Failed to fetch barangays:', err));
      }
    } else {
      setBarangays([]);
    }
  }, [value?.city, cities]);

  const handleProvinceChange = (e) => {
    onChange({ province: e.target.value, city: '', barangay: '' });
  };

  const handleCityChange = (e) => {
    onChange({ ...value, city: e.target.value, barangay: '' });
  };

  const handleBarangayChange = (e) => {
    onChange({ ...value, barangay: e.target.value });
  };

  return (
    <>
      <FormControl fullWidth margin="normal" disabled={disabled}>
        <InputLabel>Province</InputLabel>
        <Select
          value={value?.province || ''}
          onChange={handleProvinceChange}
          label="Province"
        >
          <MenuItem value="">Select Province</MenuItem>
          {provinces.map((province) => (
            <MenuItem key={province.code} value={province.name}>
              {province.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth margin="normal" disabled={disabled || !value?.province}>
        <InputLabel>City/Municipality</InputLabel>
        <Select
          value={value?.city || ''}
          onChange={handleCityChange}
          label="City/Municipality"
        >
          <MenuItem value="">Select City/Municipality</MenuItem>
          {cities.map((city) => (
            <MenuItem key={city.code} value={city.name}>
              {city.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth margin="normal" disabled={disabled || !value?.city}>
        <InputLabel>Barangay</InputLabel>
        <Select
          value={value?.barangay || ''}
          onChange={handleBarangayChange}
          label="Barangay"
        >
          <MenuItem value="">Select Barangay</MenuItem>
          {barangays.map((barangay) => (
            <MenuItem key={barangay.code} value={barangay.name}>
              {barangay.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );
};

export default LocationSelector;
