"""
Flexible File Extraction Module
Supports multiple file formats: CSV, JSON, Excel, Parquet, TSV, etc.
Automatically detects format and extracts data with proper error handling
"""

import io
import json
import pandas as pd
from pathlib import Path
from typing import Tuple, Optional


def detect_file_format(filename: str) -> Optional[str]:
    """Detect file format from filename extension"""
    ext = Path(filename).suffix.lower()
    
    format_map = {
        '.csv': 'csv',
        '.json': 'json',
        '.xlsx': 'excel',
        '.xls': 'excel',
        '.parquet': 'parquet',
        '.pq': 'parquet',
        '.tsv': 'tsv',
        '.txt': 'tsv',
        '.feather': 'feather',
        '.hdf5': 'hdf5',
        '.h5': 'hdf5',
        '.ndjson': 'ndjson',
        '.jsonl': 'ndjson',
    }
    
    detected = format_map.get(ext)
    if detected:
        print(f"📋 [file_extraction] Detected format: {detected} (extension: {ext})")
    else:
        print(f"⚠️  [file_extraction] Unknown format: {ext}")
    
    return detected


def extract_csv(contents: bytes) -> Tuple[pd.DataFrame, str]:
    """Extract data from CSV file"""
    try:
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        print(f"✅ [file_extraction] CSV loaded: {df.shape[0]} rows, {df.shape[1]} columns")
        return df, "csv"
    except Exception as e:
        # Try with different encodings
        for encoding in ['latin1', 'iso-8859-1', 'cp1252']:
            try:
                df = pd.read_csv(io.StringIO(contents.decode(encoding)))
                print(f"✅ [file_extraction] CSV loaded with {encoding}: {df.shape}")
                return df, "csv"
            except:
                continue
        raise Exception(f"Failed to read CSV: {str(e)}")


def extract_json(contents: bytes) -> Tuple[pd.DataFrame, str]:
    """Extract data from JSON file"""
    try:
        data = json.loads(contents.decode('utf-8'))
        
        # Handle both list of dicts and single dict
        if isinstance(data, list):
            df = pd.DataFrame(data)
        elif isinstance(data, dict):
            df = pd.DataFrame([data])
        else:
            raise ValueError("JSON must be a list of objects or a single object")
        
        print(f"✅ [file_extraction] JSON loaded: {df.shape[0]} rows, {df.shape[1]} columns")
        return df, "json"
    except Exception as e:
        raise Exception(f"Failed to read JSON: {str(e)}")


def extract_ndjson(contents: bytes) -> Tuple[pd.DataFrame, str]:
    """Extract data from NDJSON (newline-delimited JSON) file"""
    try:
        lines = contents.decode('utf-8').strip().split('\n')
        data = [json.loads(line) for line in lines if line.strip()]
        df = pd.DataFrame(data)
        print(f"✅ [file_extraction] NDJSON loaded: {df.shape[0]} rows, {df.shape[1]} columns")
        return df, "ndjson"
    except Exception as e:
        raise Exception(f"Failed to read NDJSON: {str(e)}")


def extract_excel(contents: bytes) -> Tuple[pd.DataFrame, str]:
    """Extract data from Excel file"""
    try:
        df = pd.read_excel(io.BytesIO(contents))
        print(f"✅ [file_extraction] Excel loaded: {df.shape[0]} rows, {df.shape[1]} columns")
        return df, "excel"
    except Exception as e:
        raise Exception(f"Failed to read Excel: {str(e)}")


def extract_parquet(contents: bytes) -> Tuple[pd.DataFrame, str]:
    """Extract data from Parquet file"""
    try:
        df = pd.read_parquet(io.BytesIO(contents))
        print(f"✅ [file_extraction] Parquet loaded: {df.shape[0]} rows, {df.shape[1]} columns")
        return df, "parquet"
    except Exception as e:
        raise Exception(f"Failed to read Parquet: {str(e)}")


def extract_feather(contents: bytes) -> Tuple[pd.DataFrame, str]:
    """Extract data from Feather file"""
    try:
        df = pd.read_feather(io.BytesIO(contents))
        print(f"✅ [file_extraction] Feather loaded: {df.shape[0]} rows, {df.shape[1]} columns")
        return df, "feather"
    except Exception as e:
        raise Exception(f"Failed to read Feather: {str(e)}")


def extract_hdf5(contents: bytes) -> Tuple[pd.DataFrame, str]:
    """Extract data from HDF5 file"""
    try:
        with io.BytesIO(contents) as buffer:
            store = pd.HDFStore(buffer)
            key = store.keys()[0]  # Get first key
            df = store.get(key)
            store.close()
        print(f"✅ [file_extraction] HDF5 loaded: {df.shape[0]} rows, {df.shape[1]} columns")
        return df, "hdf5"
    except Exception as e:
        raise Exception(f"Failed to read HDF5: {str(e)}")


def extract_tsv(contents: bytes) -> Tuple[pd.DataFrame, str]:
    """Extract data from TSV/TXT file"""
    try:
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')), sep='\t')
        print(f"✅ [file_extraction] TSV loaded: {df.shape[0]} rows, {df.shape[1]} columns")
        return df, "tsv"
    except Exception as e:
        raise Exception(f"Failed to read TSV: {str(e)}")


def extract_from_file(filename: str, contents: bytes) -> Tuple[pd.DataFrame, str, list]:
    """
    Automatically detect format and extract data from file
    
    Returns: (dataframe, detected_format, warnings)
    """
    warnings = []
    
    # Detect format
    file_format = detect_file_format(filename)
    
    # Extract based on format
    try:
        if file_format == 'csv':
            df, detected = extract_csv(contents)
        elif file_format == 'json' or file_format == 'ndjson':
            try:
                df, detected = extract_ndjson(contents)
            except:
                df, detected = extract_json(contents)
        elif file_format == 'excel':
            df, detected = extract_excel(contents)
        elif file_format == 'parquet':
            df, detected = extract_parquet(contents)
        elif file_format == 'feather':
            df, detected = extract_feather(contents)
        elif file_format == 'hdf5':
            df, detected = extract_hdf5(contents)
        elif file_format == 'tsv':
            df, detected = extract_tsv(contents)
        else:
            # Try common formats as fallback
            print(f"⚠️  [file_extraction] Unknown format, trying CSV fallback")
            try:
                df, detected = extract_csv(contents)
                warnings.append(f"File format unknown, interpreted as CSV")
            except:
                try:
                    print(f"⚠️  [file_extraction] CSV failed, trying JSON fallback")
                    df, detected = extract_json(contents)
                    warnings.append(f"File format unknown, interpreted as JSON")
                except:
                    raise Exception(f"Cannot determine file format for: {filename}")
        
        # Validate extracted data
        if df.empty:
            warnings.append("File is empty or contains no data")
            print(f"⚠️  [file_extraction] File is empty")
        
        if df.shape[1] == 0:
            raise Exception("Extracted data has no columns")
        
        print(f"✅ [file_extraction] Extraction complete: {df.shape[0]} rows, {df.shape[1]} cols")
        return df, detected, warnings
        
    except Exception as e:
        print(f"❌ [file_extraction] Extraction failed: {str(e)}")
        raise Exception(f"Failed to extract data from {filename}: {str(e)}")


def validate_extracted_data(df: pd.DataFrame) -> Tuple[bool, list]:
    """
    Validate extracted data quality
    
    Returns: (is_valid, warnings)
    """
    warnings = []
    
    # Check for empty data
    if df.empty:
        warnings.append("Dataset is empty")
        return False, warnings
    
    # Check for columns
    if df.shape[1] == 0:
        warnings.append("Dataset has no columns")
        return False, warnings
    
    # Check for mostly null columns
    for col in df.columns:
        null_ratio = df[col].isna().sum() / len(df)
        if null_ratio > 0.95:
            warnings.append(f"Column '{col}' is 95%+ empty (null_ratio: {null_ratio:.1%})")
    
    # Check for duplicate rows
    if df.duplicated().any():
        dup_count = df.duplicated().sum()
        warnings.append(f"Dataset contains {dup_count} duplicate rows ({dup_count/len(df):.1%})")
    
    # Check for any data
    if df.size == 0:
        warnings.append("Dataset contains no data points")
        return False, warnings
    
    return True, warnings
