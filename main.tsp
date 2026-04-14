import "@typespec/http";
import "@typespec/rest";

import "./models/owner.tsp";
import "./models/event-type.tsp";
import "./models/slot.tsp";
import "./models/booking.tsp";
import "./routes/owner.tsp";
import "./routes/guest.tsp";

using TypeSpec.Http;
using TypeSpec.Rest;

@service({
  title: "Calendar Booking API",
})
@server("http://localhost:3000", "Local development server")
namespace CalendarBooking;
