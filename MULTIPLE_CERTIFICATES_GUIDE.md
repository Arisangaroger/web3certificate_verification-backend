# Multiple Certificates Per Student - Guide

## 🎯 Problem Solved

Students with **double majors** or **multiple degrees** at the same graduation can now have multiple certificates without causing database conflicts.

---

## ✅ How It Works

### **CSV Processing Logic**

**Step 1: Deduplication**
- System reads CSV row by row
- Uses a `Map` with `student_id_number` as key
- Each student is stored **only once**, even if they appear in multiple rows

**Step 2: Certificate Collection**
- All certificates are collected (including duplicates for same student)
- Each certificate row is linked to student via `student_id_number`

**Step 3: Student Insertion**
- Insert unique students into database (1 insert per student)
- Get back database UUIDs

**Step 4: Certificate Linking**
- Create lookup map: `student_id_number` → `database UUID`
- Link each certificate to correct student UUID
- Insert all certificates

---

## 📝 CSV Format for Multiple Certificates

### Example: Student with Double Major

```csv
student_id_number,national_id,full_name,email,phone,photo_url,degree_title,graduation_year,class_award
ST001,1234567890,Roger Smith,roger@uni.edu,+250788123456,https://cdn.example.com/roger.jpg,Bachelor of Science in Computer Science,2024,First Class Honors
ST001,1234567890,Roger Smith,roger@uni.edu,+250788123456,https://cdn.example.com/roger.jpg,Bachelor of Science in Cybersecurity,2024,First Class Honors
```

### Example: Multiple Students, Some with Multiple Degrees

```csv
student_id_number,national_id,full_name,email,phone,photo_url,degree_title,graduation_year,class_award
ST001,1234567890,Roger Smith,roger@uni.edu,+250788123456,,Bachelor of Science in Computer Science,2024,First Class Honors
ST001,1234567890,Roger Smith,roger@uni.edu,+250788123456,,Bachelor of Science in Cybersecurity,2024,First Class Honors
ST002,9876543210,Jane Doe,jane@uni.edu,+250788654321,,Bachelor of Arts in Economics,2024,Second Class Upper
ST003,5555666677,Michael Brown,michael@uni.edu,+250788999888,,Master of Business Administration,2024,Distinction
ST003,5555666677,Michael Brown,michael@uni.edu,+250788999888,,Master of Science in Data Science,2024,Distinction
```

**Result:**
- **3 students** inserted into database
- **5 certificates** created:
  - Roger Smith: 2 certificates
  - Jane Doe: 1 certificate
  - Michael Brown: 2 certificates

---

## 🔍 Processing Flow Diagram

```
CSV File:
┌─────────────────────────────────────────────────────────┐
│ ST001,Roger,Computer Science                            │
│ ST001,Roger,Cybersecurity                               │
│ ST002,Jane,Economics                                    │
└─────────────────────────────────────────────────────────┘
                    ↓
            Parse CSV Stream
                    ↓
┌─────────────────────────────────────────────────────────┐
│ DEDUPLICATION (Map by student_id_number)                │
├─────────────────────────────────────────────────────────┤
│ Students Map:                                           │
│   ST001 → {name: Roger, email: roger@...}              │
│   ST002 → {name: Jane, email: jane@...}                │
│                                                         │
│ Certificates Array:                                     │
│   [0] {student_id: ST001, degree: Computer Science}    │
│   [1] {student_id: ST001, degree: Cybersecurity}       │
│   [2] {student_id: ST002, degree: Economics}           │
└─────────────────────────────────────────────────────────┘
                    ↓
         Insert Unique Students
                    ↓
┌─────────────────────────────────────────────────────────┐
│ Database - Students Table:                              │
│   uuid-abc → ST001, Roger                               │
│   uuid-def → ST002, Jane                                │
└─────────────────────────────────────────────────────────┘
                    ↓
      Create Student ID Lookup Map
                    ↓
┌─────────────────────────────────────────────────────────┐
│ studentIdMap:                                           │
│   ST001 → uuid-abc                                      │
│   ST002 → uuid-def                                      │
└─────────────────────────────────────────────────────────┘
                    ↓
    Link Certificates to Student UUIDs
                    ↓
┌─────────────────────────────────────────────────────────┐
│ Certificates with UUIDs:                                │
│   [0] {student_id: uuid-abc, degree: Computer Science}  │
│   [1] {student_id: uuid-abc, degree: Cybersecurity}     │
│   [2] {student_id: uuid-def, degree: Economics}         │
└─────────────────────────────────────────────────────────┘
                    ↓
        Insert All Certificates
                    ↓
┌─────────────────────────────────────────────────────────┐
│ Database - Certificates Table:                          │
│   CERT-1 → student_id: uuid-abc, degree: Comp Sci       │
│   CERT-2 → student_id: uuid-abc, degree: Cybersecurity  │
│   CERT-3 → student_id: uuid-def, degree: Economics      │
└─────────────────────────────────────────────────────────┘

✅ Result:
- 2 Students inserted
- 3 Certificates inserted
- Roger has 2 certificates
- Jane has 1 certificate
```

---

## 💡 Key Implementation Details

### 1. **Deduplication Using Map**

```typescript
const studentsMap = new Map<string, StudentRow>();

// First row: ST001
studentsMap.set('ST001', {student_id_number: 'ST001', name: 'Roger'});

// Second row: ST001 again
if (!studentsMap.has('ST001')) { // ← FALSE, already exists
  studentsMap.set('ST001', ...); // ← SKIPPED
}
```

### 2. **Certificate Collection**

```typescript
const certificates: CertificateRow[] = [];

// First row: ST001 - Computer Science
certificates.push({student_id_number: 'ST001', degree: 'Computer Science'});

// Second row: ST001 - Cybersecurity
certificates.push({student_id_number: 'ST001', degree: 'Cybersecurity'});

// ✅ Both certificates added (no deduplication here)
```

### 3. **Lookup Map Creation**

```typescript
const savedStudents = await this.studentsService.createBulk(students);
// Returns: [{id: 'uuid-abc', student_id_number: 'ST001'}, ...]

const studentIdMap = new Map<string, string>();
savedStudents.forEach((student) => {
  studentIdMap.set(student.student_id_number, student.id);
});

// Result:
// studentIdMap = {
//   'ST001' → 'uuid-abc',
//   'ST002' → 'uuid-def'
// }
```

### 4. **Certificate Linking**

```typescript
certificates.map((cert) => {
  const studentId = studentIdMap.get(cert.student_id_number);
  // cert.student_id_number = 'ST001'
  // studentId = 'uuid-abc'

  return {
    student_id: studentId, // ← Links to actual database UUID
    degree_title: cert.degree_title,
    // ... other fields
  };
});
```

---

## 🧪 Testing Multiple Certificates

### Test Case 1: Single Student, Double Major

**CSV:**
```csv
student_id_number,national_id,full_name,email,phone,photo_url,degree_title,graduation_year,class_award
ST001,1234567890,Roger Smith,roger@uni.edu,+250788123456,,Bachelor of Science in Computer Science,2024,First Class Honors
ST001,1234567890,Roger Smith,roger@uni.edu,+250788123456,,Bachelor of Science in Cybersecurity,2024,First Class Honors
```

**Expected Database Result:**

**Students Table:**
| id | student_id_number | full_name | email |
|----|-------------------|-----------|-------|
| uuid-abc | ST001 | Roger Smith | roger@uni.edu |

**Certificates Table:**
| id | student_id | degree_title | graduation_year |
|----|-----------|--------------|----------------|
| CERT-001 | uuid-abc | Bachelor of Science in Computer Science | 2024 |
| CERT-002 | uuid-abc | Bachelor of Science in Cybersecurity | 2024 |

---

### Test Case 2: Multiple Students, Mixed Certificates

**CSV:**
```csv
student_id_number,national_id,full_name,email,phone,photo_url,degree_title,graduation_year,class_award
ST001,1111111111,Alice Johnson,alice@uni.edu,+250788111111,,Bachelor of Arts in Psychology,2024,First Class
ST002,2222222222,Bob Williams,bob@uni.edu,+250788222222,,Bachelor of Science in Physics,2024,Second Class Upper
ST002,2222222222,Bob Williams,bob@uni.edu,+250788222222,,Bachelor of Science in Mathematics,2024,Second Class Upper
ST003,3333333333,Carol Davis,carol@uni.edu,+250788333333,,Master of Business Administration,2024,Distinction
```

**Expected Result:**
- **3 students** inserted
- **4 certificates** created:
  - Alice: 1 certificate
  - Bob: 2 certificates
  - Carol: 1 certificate

---

## ⚠️ Important Notes

### 1. **Student Data Must Be Consistent**

If a student appears multiple times, their personal information (name, email, national_id) must be **identical** in all rows:

✅ **Good:**
```csv
ST001,1111111111,Roger Smith,roger@uni.edu,+250788111111,,Computer Science,2024,First Class
ST001,1111111111,Roger Smith,roger@uni.edu,+250788111111,,Cybersecurity,2024,First Class
```

❌ **Bad (Inconsistent data):**
```csv
ST001,1111111111,Roger Smith,roger@uni.edu,+250788111111,,Computer Science,2024,First Class
ST001,1111111111,Roger S,roger123@uni.edu,+250788111111,,Cybersecurity,2024,First Class
```
The **first occurrence** will be used; later rows' student data is ignored.

### 2. **Email Uniqueness**

Emails must be unique across all students. If two different students have the same email, database insertion will fail due to the `UNIQUE` constraint.

### 3. **Performance**

- Deduplication is **O(n)** time complexity (single pass)
- Memory-efficient (Map stores only unique students)
- Handles large CSV files with thousands of rows

---

## ✅ Summary

**Before Fix:**
- ❌ Student with 2 degrees → Database error (duplicate student_id_number)

**After Fix:**
- ✅ Student with 2 degrees → 1 student record, 2 certificate records
- ✅ Automatic deduplication
- ✅ Correct linking of all certificates

**The system now fully supports:**
- Double majors
- Multiple degrees per student
- Mixed CSV files (some students with 1 degree, others with multiple)
