export var TicketStatus;
(function (TicketStatus) {
    TicketStatus["NEW"] = "new";
    TicketStatus["PROCESSING"] = "processing";
    TicketStatus["OPEN"] = "open";
    TicketStatus["RESOLVED"] = "resolved";
    TicketStatus["CLOSED"] = "closed";
})(TicketStatus || (TicketStatus = {}));
export var TicketCategory;
(function (TicketCategory) {
    TicketCategory["GENERAL"] = "General Question";
    TicketCategory["TECHNICAL"] = "Technical Question";
    TicketCategory["REFUND"] = "Refund Request";
})(TicketCategory || (TicketCategory = {}));
