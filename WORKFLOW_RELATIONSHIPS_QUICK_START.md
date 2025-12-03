# Workflow Relationship Builder - Quick Start Guide

## 🎉 What's Been Built

A complete visual workflow relationship builder is now integrated into your frontend! You can now:

- ✅ Visually see all workflow steps as nodes
- ✅ Drag connections between steps to create relationships
- ✅ Configure relationship types (1→1, 1→*, *→*)
- ✅ Map steps to domain tables
- ✅ Configure field mappings
- ✅ Validate relationships

---

## 🚀 How to Access

### Step 1: Run Database Migration

First, create the relationship tables in your database:

```bash
cd Backend/erp_r
python scripts/create_relationship_tables.py
```

### Step 2: Start Backend

```bash
cd Backend/erp_r
uvicorn main:app --reload
```

### Step 3: Access from Frontend

1. **Go to Workflow Management**
   - Navigate to your workflow management page
   - You'll see a list of all workflows

2. **Click the Network Icon** (🌐)
   - On any workflow card, click the blue network icon button
   - This opens the Relationship Builder for that workflow

3. **Visual Canvas Opens**
   - You'll see all workflow steps as nodes
   - Each step shows:
     - Step name and order
     - Domain table (if mapped)
     - Field count
     - Mapped/Not Mapped status

---

## 🎨 Using the Relationship Builder

### Creating Relationships

1. **Drag from Source to Target**
   - Click and drag from a step's right handle (blue circle)
   - Drop on another step's left handle
   - Relationship configuration dialog opens

2. **Configure Relationship**
   - Select relationship type: 1→1, 1→*, or *→*
   - Enter source and target table names
   - Configure source/target keys
   - Set properties (required, cascade delete, etc.)
   - Click "Save Relationship"

### Mapping Steps to Domain Tables

1. **Click Settings Icon** (⚙️) on any step node
   - Domain mapping dialog opens

2. **Configure Domain Table**
   - Enter domain table name (e.g., `companies`, `company_address`)
   - Set primary key column (default: `id`)
   - Field mappings are auto-suggested
   - Click "Save Mapping"

### Visual Indicators

- **Green Border**: Step is mapped to a domain table
- **Orange Border**: Step is not mapped (hover state)
- **Green Line**: 1→1 relationship (solid)
- **Orange Dotted Line**: 1→* relationship
- **Purple Line**: *→* relationship

### Editing/Deleting Relationships

- **Click on a relationship line** to edit
- **Click "Delete"** in the dialog to remove

---

## 📋 Example: Standard Company Onboarding

### Step 1: Map Steps to Domain Tables

1. Click Settings on **Step 1 (General Information)**
   - Domain Table: `companies`
   - Primary Key: `id`
   - Save

2. Click Settings on **Step 2 (Addresses)**
   - Domain Table: `company_address`
   - Primary Key: `id`
   - Save

3. Continue for all 9 steps...

### Step 2: Create Relationships

1. **Drag from Step 1 to Step 2**
   - Relationship Type: `1→*` (One-to-Many)
   - Source Table: `companies`
   - Target Table: `company_address`
   - Source Key: `id`
   - Target Key: `company_id`
   - Min Records: `1`
   - Save

2. **Drag from Step 1 to Step 3**
   - Relationship Type: `1→*`
   - Target Table: `company_communication_methods`
   - Save

3. **Continue for all relationships...**

### Step 3: Validate

- Click **"Validate"** button in top-right
- System checks for:
  - Circular dependencies
  - Missing domain mappings
  - Field mapping issues

---

## 🎯 Visual Features

### Canvas Controls

- **Zoom In/Out**: Mouse wheel or controls
- **Pan**: Click and drag background
- **Fit to Screen**: Auto-layout button
- **Mini Map**: Bottom-right corner

### Node Information

Each step node shows:
- Step name and order
- Domain table name (if mapped)
- Field count
- Mapped status badge

### Relationship Lines

- **Color-coded** by relationship type
- **Animated** for better visibility
- **Labeled** with relationship type (1→1, 1→*, *→*)
- **Clickable** to edit/delete

---

## 🔧 Configuration Options

### Relationship Properties

- **Is Required**: Must create target when source is created
- **Cascade Delete**: Delete target when source is deleted
- **Min Records**: Minimum records required (for 1→*)
- **Max Records**: Maximum records allowed (NULL = unlimited)

### Domain Mapping

- **Domain Table**: Target database table name
- **Primary Key**: Primary key column name
- **Field Mappings**: Map workflow fields to table columns

---

## ✅ What Works Now

- ✅ Visual canvas with all steps
- ✅ Drag-and-drop relationship creation
- ✅ Relationship configuration dialog
- ✅ Domain mapping dialog
- ✅ Edit/Delete relationships
- ✅ Validation
- ✅ Real-time updates

---

## 🐛 Troubleshooting

### "Failed to load workflow relationships"
- Check if backend is running
- Verify workflow ID is correct
- Check browser console for errors

### "Relationship already exists"
- A relationship between these steps already exists
- Click on the existing line to edit it

### "Domain mapping not found"
- Map the step to a domain table first
- Click Settings icon on the step node

---

## 📝 Next Steps

After configuring relationships:

1. **Test Data Creation**
   - Create a company using the workflow
   - Data should route to correct domain tables

2. **Verify Relationships**
   - Check database tables
   - Verify foreign keys are set correctly

3. **Monitor Performance**
   - Check query performance
   - Verify indexes are used

---

**Status:** ✅ Ready to Use! Open any workflow and click the Network icon to start building relationships!

