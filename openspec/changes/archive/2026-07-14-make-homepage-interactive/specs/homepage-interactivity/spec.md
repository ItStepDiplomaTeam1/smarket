## ADDED Requirements

### Requirement: Search input navigation
The homepage search bar SHALL allow users to type a query and click search or press Enter to navigate to the catalog page.

#### Scenario: Search query navigation
- **WHEN** the user types "молоко" in the homepage search input and clicks "Порівняти ціни"
- **THEN** the client SHALL navigate to `/catalog?q=молоко`

### Requirement: Category filter navigation
Clicking a category card on the homepage SHALL navigate to the catalog page with that category filter pre-selected.

#### Scenario: Category navigation
- **WHEN** the user clicks the "Напої" category card
- **THEN** the client SHALL navigate to `/catalog?category=drinks`

### Requirement: Popular product search navigation
Clicking "Порівняти" on a popular product card SHALL navigate to the catalog page with that product title pre-selected as the search query.

#### Scenario: Popular product comparison
- **WHEN** the user clicks "Порівняти" on the "Кава мелена" popular product card
- **THEN** the client SHALL navigate to `/catalog?q=Кава`

### Requirement: Catalog search query parameter parsing
The catalog page SHALL parse the URL query parameters on load to initialize its search query and category filters.

#### Scenario: URL query parameter parsed on mount
- **WHEN** the catalog page is loaded with URL `/catalog?q=молоко&category=drinks`
- **THEN** the client SHALL set the catalog search input value to "молоко" and category filter to "drinks"

### Requirement: Final CTA navigation
The Final CTA buttons SHALL navigate to their corresponding pages.

#### Scenario: Create Cart navigation
- **WHEN** the user clicks "Створити кошик" in the Final CTA section
- **THEN** the client SHALL navigate to `/cart`

#### Scenario: View Promos navigation
- **WHEN** the user clicks "Переглянути акції" in the Final CTA section
- **THEN** the client SHALL navigate to `/catalog?offer_type=promo`
