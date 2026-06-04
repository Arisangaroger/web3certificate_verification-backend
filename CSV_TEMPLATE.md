# CSV Upload Template

## Required CSV Format for Batch Upload

The CSV file must contain the following columns in this exact order:

```csv
student_id_number,national_id,full_name,email,phone,photo_url,degree_title,graduation_year,class_award
```

## Column Descriptions

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| `student_id_number` | String | Yes | University-issued student ID | `STU2024001` |
| `national_id` | String | Yes | National identification number | `1234567890123` |
| `full_name` | String | Yes | Student's full legal name | `John Doe Smith` |
| `email` | String | Yes | Student's email address | `john.doe@university.edu` |
| `phone` | String | No | Phone number with country code | `+250788123456` |
| `photo_url` | String | No | URL to student photo | `https://cdn.example.com/photos/student.jpg` |
| `degree_title` | String | Yes | Full degree title | `Bachelor of Science in Computer Science` |
| `graduation_year` | Integer | Yes | Year of graduation | `2024` |
| `class_award` | String | No | Class honors/award | `First Class Honors` |

## Sample CSV File

```csv
student_id_number,national_id,full_name,email,phone,photo_url,degree_title,graduation_year,class_award
STU2024001,1234567890123,John Doe Smith,john.doe@university.edu,+250788123456,https://cdn.example.com/photos/john.jpg,Bachelor of Science in Computer Science,2024,First Class Honors
STU2024002,9876543210987,Jane Mary Johnson,jane.johnson@university.edu,+250788654321,,Bachelor of Arts in Economics,2024,Second Class Upper
STU2024003,5555666677778,Michael Brown,michael.brown@university.edu,+250788999888,,Master of Business Administration,2024,Distinction
```

## Important Notes

1. **Unique Constraints**:
   - `student_id_number` must be unique within the university
   - `national_id` must be globally unique
   - `email` must be globally unique

2. **Data Validation**:
   - Email must be in valid format
   - Phone numbers should include country code
   - Graduation year must be a valid 4-digit year
   - Photo URLs must be valid HTTP/HTTPS URLs

3. **Optional Fields**:
   - `phone` can be empty
   - `photo_url` can be empty
   - `class_award` can be empty

4. **File Requirements**:
   - File format: CSV (UTF-8 encoded)
   - Maximum file size: 10MB
   - Maximum records per batch: 10,000

## Upload Process

1. Prepare CSV file following the template above
2. Login as university admin (REGISTRAR role required)
3. Navigate to batch upload endpoint
4. Upload CSV file with `university_id` parameter
5. Confirm payment via Mobile Money
6. System processes batch and anchors to blockchain

## Error Handling

If any row fails validation:
- The entire batch is rolled back
- No database changes are committed
- Error report is returned with specific row numbers and issues
