# Nimbus Marketplace Style Guide

## Overview
This style guide documents the design system, UI components, and visual patterns used throughout the Nimbus AI Hardware Marketplace application.

---

## 1. Color Palette

### Primary Colors
- **Primary Blue**: `#1976d2` (Main brand color)
  - Light: `#42a5f5`
  - Dark: `#1565c0`
  - Used for: Primary buttons, links, active states, highlights

### Secondary Colors
- **Secondary Red**: `#dc004e`
  - Used for: Secondary actions, accents

### Semantic Colors
- **Success/Green**: `#2e7d32` (Verified badges)
- **Success Light**: `#66bb6a` (NVIDIA badges)
- **Warning/Yellow**: Used for pending states, warnings
- **Error/Red**: Used for errors, rejected states
- **Info/Blue**: Used for informational messages

### Neutral Colors
- **Background**: `#fafafa` (Page backgrounds)
- **Background Light**: `#f5f5f5` (Card backgrounds, subtle sections)
- **Text Primary**: Default Material-UI text color
- **Text Secondary**: `rgba(0, 0, 0, 0.6)` or `text.secondary`
- **Border**: `rgba(0, 0, 0, 0.12)` or `#ccc`
- **White**: `#ffffff` or `white`

### Sidebar Colors (Seller/Buyer)
- **Sidebar Background**: `#1a237e` (Dark blue)
- **Sidebar Text**: `rgba(255,255,255,0.9)` (Primary text)
- **Sidebar Text Secondary**: `rgba(255,255,255,0.7)` (Section headers)
- **Sidebar Hover**: `rgba(255,255,255,0.1)`
- **Sidebar Active**: `rgba(255,255,255,0.2)`

---

## 2. Typography

### Font Family
- **Primary**: `"Roboto", "Helvetica", "Arial", sans-serif`
- System font stack for consistent cross-platform rendering

### Font Weights
- **Regular**: `400` (Default body text)
- **Medium**: `500` (Subheadings, emphasized text)
- **Semi-bold**: `600` (Headings, important labels)
- **Bold**: `700` (Prominent headings)

### Typography Scale

#### Headings
- **H1**: `h1` variant, `fontWeight: 600`
  - Used for: Page titles, major sections
- **H2**: `h2` variant, `fontWeight: 600`
  - Used for: Section titles, card headers
- **H3**: `h3` variant, `fontWeight: 500`
  - Used for: Subsection titles
- **H4**: `h4` variant, `fontWeight: 600`
  - Used for: Card titles, modal headers
- **H5**: `h5` variant
  - Used for: Smaller headings
- **H6**: `h6` variant, `fontWeight: 600`
  - Used for: List item titles, compact headings

#### Body Text
- **Body1**: `body1` variant (16px)
  - Used for: Primary body text, paragraphs
- **Body2**: `body2` variant (14px)
  - Used for: Secondary text, labels, helper text
- **Caption**: `caption` variant (12px)
  - Used for: Fine print, metadata

#### Special
- **Subtitle1**: `subtitle1` variant
  - Used for: Card descriptions
- **Subtitle2**: `subtitle2` variant, `color: 'rgba(255,255,255,0.7)'`
  - Used for: Sidebar section headers

---

## 3. Spacing & Layout

### Spacing Scale (Material-UI 8px grid)
- **xs**: `0.5` (4px) - Tight spacing
- **sm**: `1` (8px) - Small spacing
- **md**: `2` (16px) - Medium spacing (default)
- **lg**: `3` (24px) - Large spacing
- **xl**: `4` (32px) - Extra large spacing
- **xxl**: `6` (48px) - Section spacing

### Container Widths
- **Full Width**: No max-width
- **Container**: `maxWidth="lg"` (1200px) - Most pages
- **Container Medium**: `maxWidth="md"` (900px) - Forms, modals
- **Container Small**: `maxWidth="sm"` (600px) - Narrow forms

### Padding
- **Card Padding**: `p: 3` or `p: 4` (24px or 32px)
- **Page Padding**: `py: 4` (vertical), `px: 2` or `px: 3` (horizontal)
- **Section Padding**: `mb: 3` or `mb: 4` (between sections)

---

## 4. Components

### Buttons

#### Primary Button
```jsx
<Button variant="contained" color="primary">
  Primary Action
</Button>
```
- **Use**: Main actions (Submit, Save, Confirm)
- **Style**: Solid background, white text
- **Size**: `size="large"` for important actions, default for others

#### Secondary Button
```jsx
<Button variant="outlined" color="primary">
  Secondary Action
</Button>
```
- **Use**: Secondary actions, cancel, back
- **Style**: Outlined border, transparent background

#### Text Button
```jsx
<Button variant="text">
  Tertiary Action
</Button>
```
- **Use**: Less important actions, links styled as buttons

#### Button Styling
- **Border Radius**: `8px` (default from theme)
- **Text Transform**: `none` (default from theme)
- **Full Width**: `fullWidth` prop for form buttons
- **Disabled**: Grayed out with reduced opacity

### Cards

#### Standard Card
```jsx
<Card>
  <CardContent sx={{ p: 3 }}>
    {/* Content */}
  </CardContent>
</Card>
```
- **Border Radius**: `12px` (default from theme)
- **Shadow**: `0 2px 8px rgba(0,0,0,0.1)` (default from theme)
- **Background**: White
- **Padding**: `p: 3` or `p: 4`

#### Card Variations
- **Sticky Card**: `sx={{ position: 'sticky', top: 20 }}`
- **Background Card**: `sx={{ backgroundColor: '#f5f5f5' }}`
- **Bordered Card**: `sx={{ border: '1px dashed #ccc', backgroundColor: '#fafafa' }}`

### Chips/Badges

#### Status Chips
- **Success**: `color="success"` - Completed, accepted, verified
- **Warning**: `color="warning"` - Pending, in progress
- **Error**: `color="error"` - Rejected, cancelled
- **Default**: `color="default"` - Neutral states

#### Badge Colors
- **Verified Badge**: `#2e7d32` (dark green)
- **NVIDIA Badge**: `#66bb6a` (light green)

### Forms

#### Text Fields
```jsx
<TextField
  fullWidth
  label="Label"
  name="fieldName"
  value={value}
  onChange={handleChange}
  required
/>
```
- **Full Width**: Use `fullWidth` prop
- **Required**: Show asterisk with `required` prop
- **Helper Text**: Use `helperText` prop
- **Error State**: `error` prop with `helperText` for validation

#### Form Layout
- **Grid Spacing**: `spacing={3}` (24px between fields)
- **Grid Items**: `xs={12} sm={6}` for responsive 2-column layout
- **Form Actions**: Buttons at bottom, right-aligned or full-width

### Alerts

#### Types
- **Success**: `severity="success"` - Green, checkmark icon
- **Error**: `severity="error"` - Red, error icon
- **Warning**: `severity="warning"` - Yellow/orange
- **Info**: `severity="info"` - Blue, info icon

### Loading States

#### Circular Progress
```jsx
<CircularProgress />
```
- **Centered**: `display="flex" justifyContent="center" alignItems="center" minHeight="100vh"`
- **Inline**: Small size for inline loading

### Empty States

#### Pattern
```jsx
<Paper sx={{ p: 8, textAlign: 'center' }}>
  <Icon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
  <Typography variant="h6" color="text.secondary">
    No items found
  </Typography>
  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
    Description text
  </Typography>
</Paper>
```

---

## 5. Icons

### Icon Library
Material-UI Icons (`@mui/icons-material`)

### Common Icons
- **Navigation**: `ArrowBack`, `ArrowForward`
- **Actions**: `CheckCircle`, `Close`, `Delete`, `Edit`
- **Status**: `Pending`, `Verified`, `Security`
- **Business**: `ShoppingCart`, `AttachMoney`, `Assignment`, `Description`
- **Navigation**: `Dashboard`, `Menu`, `Search`, `FilterList`
- **User**: `Person`, `AccountBalance`, `Visibility`

### Icon Usage
- **Size**: Default `20px` for inline, `24px` for buttons, `48px`/`64px` for empty states
- **Color**: `color="action"` for neutral, `color="primary"` for brand, semantic colors for status
- **Spacing**: `sx={{ mr: 2 }}` for left margin, `sx={{ ml: 2 }}` for right margin

---

## 6. Navigation

### Sidebar (Seller/Buyer)
- **Background**: `#1a237e` (dark blue)
- **Width**: `280px` (seller create listing), varies for buyer
- **Fixed Position**: `position: 'fixed'`, `height: '100vh'`
- **Scrollable**: `overflowY: 'auto'` for long content

### Sidebar Navigation Items
```jsx
<Button
  fullWidth
  onClick={() => navigate('/path')}
  sx={{
    justifyContent: 'flex-start',
    px: 2,
    py: 1.5,
    color: 'rgba(255,255,255,0.9)',
    textTransform: 'none',
    fontWeight: 400,
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
  }}
>
  🔒 Change Password
</Button>
```

### Breadcrumbs
- **Location**: Top of page content
- **Style**: Simple text with separators (`>`)
- **Example**: `Home > AI Hardware Marketplace`

---

## 7. Cards & Listings

### Listing Card (Marketplace/Landing)
- **Layout**: Brand-based design (no images)
- **Elements**:
  - Brand badge (NVIDIA) - green chip
  - GPU name as main heading
  - Specifications (GPU model × count, RAM, Storage)
  - Pricing section (price, shipping, location)
  - Action buttons (Make Offer, Purchase)
  - Heart icon (favorite)
- **Hover**: Enhanced shadow, slight elevation
- **Border**: No border, shadow only
- **Border Radius**: `12px` or higher

### Summary Cards (Dashboard)
- **Layout**: Icon + number + label
- **Icons**: Large (40px), colored
- **Numbers**: Large typography (`variant="h4"`)
- **Background**: White card with subtle shadow

---

## 8. Pagination

### Pattern
```jsx
<Pagination
  count={totalPages}
  page={page}
  onChange={handlePageChange}
  color="primary"
  size="large"
  showFirstButton
  showLastButton
/>
```
- **Items Per Page**: 
  - Marketplace: `9` items
  - Landing Page: `12` items
- **Location**: Centered below content
- **Spacing**: `mt: 4, mb: 4`

---

## 9. Tabs

### Pattern
```jsx
<Tabs value={tabValue} onChange={handleTabChange}>
  <Tab label="Tab 1" />
  <Tab label="Tab 2" />
</Tabs>
```
- **Container**: Wrapped in `Paper` component
- **Border**: Bottom border divider
- **Active**: Primary color underline

---

## 10. Dialogs/Modals

### Confirmation Dialog
```jsx
<Dialog open={open} onClose={handleClose}>
  <DialogTitle>Title</DialogTitle>
  <DialogContent>
    <Typography>Content</Typography>
  </DialogContent>
  <DialogActions>
    <Button onClick={handleClose}>Cancel</Button>
    <Button onClick={handleConfirm} variant="contained">Confirm</Button>
  </DialogActions>
</Dialog>
```

---

## 11. Data Display

### Date Formatting
- **Pattern**: Use Firestore Timestamp `.toDate()` method
- **Display**: `toLocaleDateString()` for dates
- **Fallback**: Handle both Firestore Timestamp and plain objects

### Price Formatting
- **Pattern**: `price?.toLocaleString()` for numbers
- **Currency**: Prefix with `$` symbol
- **Example**: `$${contract.totalValue?.toLocaleString() || '0'}`

### Status Display
- **Chips**: Use `Chip` component with semantic colors
- **Icons**: Include status icons in chips
- **Text**: Clear, descriptive labels

---

## 12. Responsive Design

### Breakpoints (Material-UI)
- **xs**: 0px (mobile)
- **sm**: 600px (tablet)
- **md**: 900px (small desktop)
- **lg**: 1200px (desktop)
- **xl**: 1536px (large desktop)

### Grid System
```jsx
<Grid container spacing={3}>
  <Grid item xs={12} sm={6} md={4}>
    {/* Content */}
  </Grid>
</Grid>
```
- **Mobile First**: `xs={12}` (full width on mobile)
- **Tablet**: `sm={6}` (2 columns)
- **Desktop**: `md={4}` (3 columns)

### Sidebar Behavior
- **Desktop**: Fixed sidebar, content margin-left
- **Mobile**: Consider collapsing or drawer pattern

---

## 13. Animations & Transitions

### Hover Effects
- **Cards**: Shadow increase on hover
- **Buttons**: Background color change
- **Links**: Underline or color change

### Transitions
- **Default**: Material-UI default transitions
- **Smooth**: Use for state changes

---

## 14. Accessibility

### Color Contrast
- Ensure WCAG AA compliance (4.5:1 for text)
- Don't rely solely on color for information

### Keyboard Navigation
- All interactive elements should be keyboard accessible
- Focus states visible

### ARIA Labels
- Use descriptive labels for icons
- Screen reader friendly

---

## 15. Common Patterns

### Page Structure
```jsx
<Box sx={{ backgroundColor: '#fafafa', minHeight: '100vh', py: 4 }}>
  <Container maxWidth="lg">
    {/* Header */}
    <Box mb={4}>
      <Typography variant="h4">Page Title</Typography>
    </Box>
    
    {/* Content */}
    <Grid container spacing={3}>
      {/* Items */}
    </Grid>
  </Container>
</Box>
```

### Loading State
```jsx
{loading ? (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
    <CircularProgress />
  </Box>
) : (
  {/* Content */}
)}
```

### Error State
```jsx
{error && (
  <Alert severity="error" sx={{ mb: 3 }}>
    {error}
  </Alert>
)}
```

### Success State
```jsx
{success && (
  <Alert severity="success" sx={{ mb: 3 }}>
    Success message
  </Alert>
)}
```

---

## 16. Code Style

### Component Structure
1. Imports (React, Router, Firebase, MUI, Icons)
2. Component definition
3. State declarations
4. useEffect hooks
5. Functions/handlers
6. Render logic
7. Return JSX

### Naming Conventions
- **Components**: PascalCase (`BuyerDashboard`)
- **Functions**: camelCase (`handleSubmit`, `fetchData`)
- **Variables**: camelCase (`userProfile`, `loading`)
- **Constants**: UPPER_SNAKE_CASE or camelCase (`CARD_W`, `itemsPerPage`)

### File Organization
- One component per file
- Component name matches filename
- Exports at bottom of file

---

## 17. Best Practices

### Do's ✅
- Use Material-UI theme for consistent styling
- Use `sx` prop for component-specific styles
- Keep components focused and single-purpose
- Use semantic HTML elements
- Provide loading and error states
- Use consistent spacing scale
- Follow responsive design patterns

### Don'ts ❌
- Don't hardcode colors (use theme)
- Don't use inline styles (use `sx` prop)
- Don't skip error handling
- Don't forget loading states
- Don't use arbitrary spacing values
- Don't ignore responsive breakpoints

---

## 18. Future Considerations

### Potential Improvements
- Dark mode support
- Custom theme configuration
- Animation library integration
- Enhanced accessibility features
- Component library documentation
- Design tokens system

---

## Revision History
- **v1.0** - Initial style guide creation
- Based on Nimbus Marketplace codebase analysis

