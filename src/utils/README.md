# Utils

Deze folder bevat herbruikbare utility functies voor de hele applicatie.

## dateUtils.ts

Utility functies voor datum filtering en formatting, specifiek voor PocketBase queries.

### Functies

#### `formatDateSQL(date: Date): string`

Formatteert een datum naar SQL formaat (YYYY-MM-DD HH:MM:SS)

```typescript
import { formatDateSQL } from 'src/utils/dateUtils';

const date = new Date();
const sqlDate = formatDateSQL(date); // "2024-01-15 14:30:00"
```

#### `getTodayStart(): Date`

Berekent de start van vandaag (00:00:00)

```typescript
import { getTodayStart } from 'src/utils/dateUtils';

const todayStart = getTodayStart(); // 2024-01-15 00:00:00
```

#### `getTomorrowStart(): Date`

Berekent de start van morgen (00:00:00)

```typescript
import { getTomorrowStart } from 'src/utils/dateUtils';

const tomorrowStart = getTomorrowStart(); // 2024-01-16 00:00:00
```

#### `getTodayEventsFilter(): string`

Genereert een PocketBase filter voor events van vandaag

```typescript
import { getTodayEventsFilter } from 'src/utils/dateUtils';

const filter = getTodayEventsFilter();
// "startdate >= \"2024-01-15 00:00:00\" && startdate < \"2024-01-16 00:00:00\""

const result = await pb.collection('events').getList(1, 50, { filter });
```

#### `getFromTodayEventsFilter(): string`

Genereert een PocketBase filter voor events vanaf vandaag

```typescript
import { getFromTodayEventsFilter } from 'src/utils/dateUtils';

const filter = getFromTodayEventsFilter();
// "startdate >= \"2024-01-15 00:00:00\""
```

#### `getUntilTodayEventsFilter(): string`

Genereert een PocketBase filter voor events tot en met vandaag

```typescript
import { getUntilTodayEventsFilter } from 'src/utils/dateUtils';

const filter = getUntilTodayEventsFilter();
// "startdate < \"2024-01-16 00:00:00\""
```

#### `getDateEventsFilter(date: Date): string`

Genereert een PocketBase filter voor events van een specifieke datum

```typescript
import { getDateEventsFilter } from 'src/utils/dateUtils';

const specificDate = new Date('2024-01-15');
const filter = getDateEventsFilter(specificDate);
// "startdate >= \"2024-01-15 00:00:00\" && startdate < \"2024-01-16 00:00:00\""
```

#### `getDateRangeEventsFilter(startDate: Date, endDate: Date): string`

Genereert een PocketBase filter voor events van een datum range

```typescript
import { getDateRangeEventsFilter } from 'src/utils/dateUtils';

const startDate = new Date('2024-01-15');
const endDate = new Date('2024-01-20');
const filter = getDateRangeEventsFilter(startDate, endDate);
// "startdate >= \"2024-01-15 00:00:00\" && startdate < \"2024-01-21 00:00:00\""
```

### Gebruik in componenten

```typescript
import { getTodayEventsFilter, getFromTodayEventsFilter } from 'src/utils/dateUtils';

// Events van vandaag
const todayFilter = getTodayEventsFilter();
const todayEvents = await pb.collection('events').getList(1, 50, { filter: todayFilter });

// Events vanaf vandaag (toekomstige events)
const futureFilter = getFromTodayEventsFilter();
const futureEvents = await pb.collection('events').getList(1, 50, { filter: futureFilter });
```
