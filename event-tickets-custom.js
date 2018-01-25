/**
 * Manage tickets and attendees on Event pages.
 * @todo
 *  - Finish get_Attendee_AllFormFields to return all form fields for 'this' attendee
 * @author Thomas Ocean <srcthomas@gmail.com>
 */
jQuery( (function( w, d, $ ) {

    $( d ).ready( function () {

        var storage_UserProfileChildInfo,
            attendeeFieldsToHide,
            storage_TicketsAndAttendees,
            selector_AttendeeName,
            selector_AttendeeName_Text,
            selector_AttendeeName_Select,
            selector_TicketsForm,
            selector_TicketsForm_Submit;

        /**
         * Initialise tickets/attendees store & add ticket quantity and attendee name event listeners.    
         */
        function init() {
            //
            storage_TicketsAndAttendees  = [];
            storage_UserProfileChildInfo = window.storage_UserProfileChildInfo;
            selector_AttendeeName        = '[id$="attendee-name"]';
            selector_AttendeeName_Text   = 'input'  + selector_AttendeeName;
            selector_AttendeeName_Select = 'select' + selector_AttendeeName;
            selector_TicketsForm         = 'form#buy-tickets';
            selector_TicketsForm_Submit  = selector_TicketsForm + ' table.tribe-events-tickets button[type="submit"]';
            attendeeFieldsOnTicket       = {
              //'ticket-field-name'     : 'profile-field-name'
                'attendee-name'                             : 'attendee-name',
                'attendee-first-name'                       : 'first-name',
                'attendee-last-name'                        : 'last-name',
                'attendee-age'                              : 'age', // age created dynamically from 'd-o-b' field
                'attendee-d-o-b'                            : 'd-o-b',
                'attendee-school-year'                      : 'school-year',
                'attendee-medical-condition-information'    : 'medical-condition-information',
                'attendee-special-requirement-information'  : 'special-requirement-information'
            };
            attendeeFieldsToHide         = [
                'attendee-first-name',
                'attendee-last-name',
                'attendee-age',
                'attendee-d-o-b',
                'attendee-school-year',
                'attendee-medical-condition-information',
                'attendee-special-requirement-information'
            ];

            // Remove public access to variable.
            window.storage_UserProfileChildInfo = '';

            // Setup 'attendee-name' property for each child profile.
            helper_CreateAttendeeNameField();
            // Setup 'attendee-age' property for each child profile.
            helper_CreateAttendeeAgeField();

            var ticket_ID  = '',
                ticket_Num = 0,
                $tickets   = $.makeArray( $('.tribe-events-tickets tr') ); // '.tribe-events-tickets tr:not([id])'

            // Remove every tr if not a ticket.
            // Start from end to facilitate splicing without messing up index.
            for ( var i = $tickets.length - 1; i >= 0; i-- ) {
                // Get this ticket ID
                ticket_ID = $( $tickets[i].firstChild ).attr( 'data-product-id' );
                // Remove element if no ticket ID else add to ticket array
                if ( undefined === ticket_ID ) {
                    $tickets.splice( i, 1 );
                } else {
                    // Store ticket information
                    storage_TicketsAndAttendees[ticket_Num]                           = [];
                    storage_TicketsAndAttendees[ticket_Num]['id']                     = ticket_ID;
                    storage_TicketsAndAttendees[ticket_Num]['$container-ticket']      = $( $tickets[i] );
                    storage_TicketsAndAttendees[ticket_Num]['$element-qty']           = $( $tickets[i] ).find( 'input.qty' );
                    storage_TicketsAndAttendees[ticket_Num]['attendees-containers']   = [];
                    ticket_Num++;
                }
            }

            // Wait until ticket quantity and ticket attendees match before syncing tickets and applying listeners.
            // In saying this, get initialised quick as this is with the page load.
            helper_IfFuncTrueCallFunc(
                [
                    sync_TicketAttendees,
                    setListeners_Tickets
                ],
                isEqual_QtyTicketAndQtyAttendee,
                50
            );
        }

        /**
         * Ensure ticket quantity and attendee numbers match.
         * Returns true when numbers match and attendee info fields inactive.
         * @return true bool    
         */
        function isEqual_QtyTicketAndQtyAttendee() {
            var isEqual = true;
            var ticket_ID;
            // compare each ticket quantity with attendee containers per ticket.
            storage_TicketsAndAttendees.forEach(
                function( value, index, array ) {
                    ticket_ID = array[index]['id'];
                    // Ignore comparison if ticket has no quantity as ticket 'Out of stock!'
                    if ( array[index]['$element-qty'].length == 0 ) {
                        return;
                    }
                    // return false if any ticket's quantity and its attendee numbers don't match
                    if ( array[index]['$element-qty'].val() != get_LiveTicketAttendees( ticket_ID ).length ) {
                        isEqual = false;
                    }
                }
            );
            return isEqual;
        }

        /**
         * Set attendee fields to inactive then add or remove stored attendees to match the live attendees.
         * Activate fields before ending returning.
         * Returns true when sync complete.
         * @return true bool    
         */
        function sync_TicketAttendees() {
            var newAttendeeCount;
            // iterate over all tickets
            $.each(
                storage_TicketsAndAttendees,
                function () {
                    // get difference between stored attendees vs live attendees
                    var difference = getDifference_Attendees_StoredVsLive( this['id'] );
                    var diff_sign  = '';
                    // Ideally this would just be 'Math.sign( difference )'' but IE doesn't facilitate it.
                    // This should be as simple as Math.sign( difference ) but IE doesn't facilitate it.
                    if ( difference < 0 ) {
                        diff_sign = -1;
                    }
                    //
                    if ( difference > 0 ) {
                        diff_sign =  1;
                    }
                    // Remove or add attendees to store
                    switch ( diff_sign ) {
                        case  1 :
                            newAttendeeCount = addAttendeeToStoredTicket(      this['id'], difference );
                            helper_ConvertElem_InputToSelect(                  this['id']             );
                            setElem_AttendeeNameDropdown(                      this['id']             );
                            setListeners_Attendee(                             this['id']             );
                            hide_AttendeeFields(                               attendeeFieldsToHide   );
                            break;
                        case -1 :
                            newAttendeeCount = removeAttendeeFromStoredTicket( this['id'], difference );
                            break;
                        default :
                            // do nothing
                    }
                }
            );
            // Ticket Attendees should now be synced.
        }

        /**
         * Determine whether attendees added or removed from page.
         *  - Positive number shows attendees added.
         *  - Negative number shows attendees removed.
         * @param ticket int Ticket ID to query storage_TicketsAndAttendees
         * @return difference   int    
         */
        function getDifference_Attendees_StoredVsLive( ticket_ID ) {
            var difference              = 0;
            var number_liveAttendees    = ( get_LiveTicketAttendees(   ticket_ID ) ).length;
            var number_storedAttendees  = ( get_StoredTicketAttendees( ticket_ID ) ).length;

            difference = ( number_liveAttendees - number_storedAttendees );

            return difference;
        }

        /**
         * Add end attendee to current ticket until difference between stored and live attendees matched.
         * @param ticket int Ticket ID to query storage_TicketsAndAttendees
         * @param difference_AttendeeQty_StoredVsLive difference between stored and live attendees
         * return number_NewAttendeeCount int total number of attendees for this ticket.    
         */
        function addAttendeeToStoredTicket( ticket_ID, difference_AttendeeQty_StoredVsLive ) {
            var number_NewAttendeeCount;
            var number_NewAttendee           = ( get_StoredTicketAttendees( ticket_ID ) ).length;
            var  elems_NewAttendeeContainers =   get_LiveTicketAttendees  ( ticket_ID );
            //
            for ( var i = 0; i < difference_AttendeeQty_StoredVsLive; i++ ) {
                $.each(
                    storage_TicketsAndAttendees,
                    function () {
                        if ( helper_IsThisCurrentTicket( ticket_ID, this['id'] ) ) {
                            this['attendees-containers'].push( elems_NewAttendeeContainers[number_NewAttendee++] );
                        }
                    }
                );
            }

            number_NewAttendeeCount = get_LiveTicketAttendees( ticket_ID ).length;

            return number_NewAttendeeCount;
        }

        /**
         * Remove end attendee from current ticket until difference between stored and live attendees matched.
         * @param ticket array
         * @param difference_AttendeeQty_StoredVsLive difference between stored and live attendees    
         */
        function removeAttendeeFromStoredTicket( ticket_ID, difference_AttendeeQty_StoredVsLive ) {
            for ( var i = 0; i > difference_AttendeeQty_StoredVsLive; i-- ) {
                $.each(
                    storage_TicketsAndAttendees,
                    function () {
                        if ( helper_IsThisCurrentTicket( ticket_ID, this['id'] ) ) {
                            //
                            this['attendees-containers'].pop();
                        }
                    }
                );
            }
        }

        /**
         * Populate each Attendee Name select field with attendee names if it currently has no options.    
         */
        function setElem_AttendeeNameDropdown( ticket_ID ) {
            $.each(
                get_StoredTicketAttendees( ticket_ID ),
                function ( i, attendeeContainer ) {
                    $.each(
                        $( attendeeContainer ).find( selector_AttendeeName_Select ),
                        function ( i, elem_AttendeeName ) {
                            var elem_Select = $( elem_AttendeeName );
                            // Skip as Attendee Name select element already has options.
                            if ( elem_Select.has( 'option' ).length != 0 ) {
                                return;
                            }
                            elem_Select.append( '<option>- select attendee -</option>' )
                            // Populate this Attendee Name field with all child names.
                            $.each(
                                get_ChildNames( 'attendee-name' ),
                                function ( i, attendeeName ) {
                                    elem_Select.append( '<option>' + attendeeName + '</option>' );
                                }
                            );
                        }
                    );
                }
            );
        }

        /**
         * .
         * @param ticket_ID int
         * @param attendeeName string Name of stored attendee to attain     
         */
        function setElems_AttendeeFields( ticket_ID, attendeeName ) {
            // 
            $.each(
                get_StoredTicketAttendees( ticket_ID ),
                function ( i, attendeeContainer ) {
                    // $.each(
                    //     $( attendeeContainer ).find( selector_AttendeeName_Select ),
                    //     function ( i, elem_AttendeeName ) {
                    //         var elem_Select = $( elem_AttendeeName );
                    //         // Skip as Attendee Name select element already has options.
                    //         if ( elem_Select.has( 'option' ).length != 0 ) {
                    //             return;
                    //         }
                    //         // Populate this Attendee Name field with all child names.
                    //         $.each(
                    //             get_ChildNames( 'attendee-name' ),
                    //             function ( i, attendeeName ) {
                    //                 elem_Select.append( '<option>' + attendeeName + '</option>' );
                    //             }
                    //         );
                    //     }
                    // );
                }
            );
        }

        /**
         * @param ticket_ID int ticket number to reference ticket.
         * return ticketAttendees jQuery all attendee container elements for current ticket    
         */
        function get_LiveTicketAttendees( ticket_ID ) {
            var    ticketAttendees = $( '#tribe-event-tickets-plus-meta-' + ticket_ID + ' .tribe-event-tickets-plus-meta-attendee' );
            return ticketAttendees;
        }

        /**
         * @param ticket_ID int ticket number to reference ticket.
         * return storedAttendees array Collection of all stored attendee container elements.    
         */
        function get_StoredTicketAttendees( ticket_ID ) {
            var storedAttendees;
            $.each(
                storage_TicketsAndAttendees,
                function () {
                    if ( helper_IsThisCurrentTicket( ticket_ID, this['id'] ) ) {
                        storedAttendees = this['attendees-containers'];
                    }
                }
            );
            return storedAttendees;
        }

        /**
         * 
         * @param elem string Name of element container.
         * return     
         */
        function get_Attendee_AllFormFields( attendee ) {
            // 
            var elemContainer       = $( elem );
            var formElementTypes    = [
                'input',
                'select',
                'textarea'
            ]
            //
            $.each(
                $( elemContainer ).find( 'input' ),
                function () {
                    // something
                }
            );
        }

        /**
         * Get attributes of a given type for all children.
         * @param attribute string Name of a single attribute.
         * return storedChildNames array Collection of all stored child attributes.    
         */
        function get_ChildNames( attribute ) {
            var storedChildAttributes = [];
            $.each(
                storage_UserProfileChildInfo,
                // add names to storedChildNames array
                function ( i, info_Child ) {
                    var name_Attendee = '<no name in child profile>';
                    // Check if attendee-name exists and and isn't empty.
                    if ( info_Child.hasOwnProperty( ['attendee-name'] ) && info_Child['attendee-name'] != '' ) {
                        name_Attendee = info_Child['attendee-name'];
                    }
                    storedChildAttributes.push( name_Attendee );
                }
            );
            return storedChildAttributes;
        }

        /**
         * Create lock on element decendent to prevent user data changes.
         * @param form string Selector for element    
         */
        function lockCreate_ElementDecendents( elem ) {
            // Iterate over attendee and deactive form fields
            // @todo run function to return all form fields from given element then set disable property on those elements only.
            $( elem + ' *' ).prop( 'disabled', true );
        }

        /**
         * Release lock on element decendent to enable user data changes.    
         */
        function lockRelease_ElementDecendents( elem ) {
            // Iterate over attendee and deactive form fields
            // @todo run function to return all form fields from given element then set disable property on those elements only.
            $( elem + ' *' ).prop( 'disabled', false );
        }

        /**
         * Hide all attendee fields specified.
         * @param fields array One index per field name to hide.
         *  - Form field unique identifier specified at end of 'name' attr.    
         */
        function hide_AttendeeFields( fields ) {
            $.each(
                fields,
                function ( i, field ) {
                    $.each(
                        $( '[id$="' + field + '"]' ),
                        function( i, elem ){
                            $(this).parent().css( 'display', 'none' );
                        }
                    );
                }
            )
        }


        /* Event Listeners */

        /**
         * Set listeners on ticket quantity elements.    
         */
        function setListeners_Tickets() {
            $.each(
                storage_TicketsAndAttendees,
                function () {
                    $( this['$element-qty'] ).change(
                        function () {
                            listenChange_Ticket_Quantity( this['id'] );
                        }
                    );
                }
            );
        }

        // /**
        //  * 
        //  */
        // function updateListeners_Ticket() {}

        /**
         * Set listeners on attendee input/select elements
         * @param ticket_ID int ticket number to reference ticket.    
         */
        function setListeners_Attendee( ticket_ID ) {
            $.each(
                get_StoredTicketAttendees( ticket_ID ),
                function ( i, attendee ) {
                    $( attendee )
                        .find( selector_AttendeeName )
                        .off()
                        .change(
                            cb_listenChange_Ticket_AttendeeName( attendee )
                        );
                }
            );
        }

        /**
         * Run ticket sync each time ticket quanity change occurs.    
         */
        function listenChange_Ticket_Quantity() {
            // Wait until ticket quantity and ticket attendees match before syncing tickets and applying listeners.
            helper_IfFuncTrueCallFunc(
                [
                    sync_TicketAttendees
                ],
                isEqual_QtyTicketAndQtyAttendee,
                200
            );
        }

        /**
         * Callback action taken when attendee name changed.
         * @param ticket_ID int Number to reference ticket the event lister is associated with.    
         */
        function cb_listenChange_Ticket_AttendeeName( attendee ) {
            // Return the function to access attendee via closure.
            return function() {
                    var selected_ChildInfo   = '';
                    var selected_AttendeeName   = $( this ).val();
                    // Ensure the selected name exists.
                    $.each(
                        storage_UserProfileChildInfo,
                        function ( i, info_Child ) {
                            // Exit if not the selected child.
                            if ( ! info_Child.hasOwnProperty( 'attendee-name' ) || info_Child['attendee-name'] != selected_AttendeeName ) {
                                return;
                            }
                            selected_ChildInfo = info_Child;
                        }
                    );
                    // Update fields
                    for ( field in attendeeFieldsOnTicket ) {
                        // Ignore Attendee Name as it's already set.
                        if ( 'attendee-name' == field ) {
                            continue;
                        }
                        // update fields
                        $( attendee )
                            .find( '[id$="' + field + '"]' )
                            .val(   selected_ChildInfo[attendeeFieldsOnTicket[field]] );
                    }
                }
        }


        /* Helper functions */

        /**
         * Helper function used to ensure a condition returns true before function is called.
         * func_IsTrue will be tested repeitively in milliseconds according to interval until
         * func_ToCall met or triesBeforeExit loop number is reached.
         * @param funcs_ToCall      arrau Functions to call when func_IsTrue returns true.
         * @param func_IsTrue       func  Function to test condition. Must return true or false.
         * @param interval          int   Millisecond based number used to set function call interval.
         * @param triesBeforeExit   int   Number to test condition before exiting loop.    
         */
        function helper_IfFuncTrueCallFunc( funcs_ToCall, func_IsTrue, interval, triesBeforeExit ) {
            var trueCount  = 0;
            var trueTotal  = 5;
            var loopCount  = 0;
            var loopTotal  = triesBeforeExit || 100;
            var intervalID = setInterval(
                function () {
                    loopCount++;
                    if ( func_IsTrue() ) {
                        // Proceed only if we're sure the user hasn't changed the ticket quantity again.
                        if ( isTrueTotalExceeded() ) {
                            clearInterval( intervalID );
                            // Disable form decendent elements
                            lockCreate_ElementDecendents( selector_TicketsForm );
                            // Run functions
                            $.each(
                                funcs_ToCall,
                                function( i, func_ToCall ) {
                                    func_ToCall();
                                }
                            );
                            // Enable form decendent elements
                            lockRelease_ElementDecendents( selector_TicketsForm );
                            //
                        } else {
                            trueCount++;
                        }
                    } else if ( isLoopTotalExceeded() ) {
                        if ( isTrueTotalExceeded() ) {
                            clearInterval( intervalID );
                        } else {
                            trueCount++;
                        }
                    } else {
                        trueCount = 0;
                    }
                },
                interval || 500
            );

            function isLoopTotalExceeded() {
                return ( loopTotal < loopCount );
            }

            function isTrueTotalExceeded() {
                return ( trueTotal < trueCount );
            }
        }

        /**
         * @param ticket_ID int ticket number to reference ticket.
         * return storedAttendees array Collection of all stored attendee container elements.    
         */
        function helper_IsThisCurrentTicket( ticket_ID, currTicket_ID ) {
            return ( ticket_ID == currTicket_ID );
        }

        /**
         * @param stringOld string String to be converted.
         * @param charOld   string String of char(s) to be replaced.
         * @param charNew   string String of char(s) to replace charOld.
         * @param string    string String to be converted.
         * return stringNew string Converted string    
         */
        function helper_ConvertText_SwapChars( stringOld, charOld, charNew ) {
            var regex       = new RegExp( charOld, "g" )
            var stringNew   = stringOld.replace( regex, charNew );

            return stringNew;
        }

        /**
         * Convert all ticket input elements to select elements.
         * Every call to this method envokes a test for every set of intendee inputs and converts any input[name$="[attendee-name]"] fields.
         * @param ticket_ID int    
         */
        function helper_ConvertElem_InputToSelect( ticket_ID ) {
            //
            var $attendees,
                $elem_AttendeeName_Text,
                $elem_AttendeeName_Select,
                elem_Input_Attributes;

            $.each(
                get_StoredTicketAttendees( ticket_ID ),
                function ( i, attendeeContainer ) {
                    //
                    $elem_AttendeeName_Text = $( attendeeContainer ).find( selector_AttendeeName_Text );
                    // If $elem_AttendeeName_Text exists then add select etc...
                    if ( $elem_AttendeeName_Text.length ) {
                        // This will supply only the select. Another method will populate the select with current account specified attendee names.
                        $elem_AttendeeName_Text.after( "<select id='attendee-name'></select>" );
                        $elem_AttendeeName_Select = $( attendeeContainer ).find( selector_AttendeeName_Select );

                        elem_Input_Attributes = $elem_AttendeeName_Text.prop( 'attributes' );

                        // loop through oldScript attributes and apply them on new script
                        $.each(
                            elem_Input_Attributes,
                            function ( i, attendeeInputField ) {
                                if ( attendeeInputField.name != 'style' ) {
                                    $elem_AttendeeName_Select.attr( attendeeInputField.name, attendeeInputField.value );
                                }
                            }
                        );
                        $( $elem_AttendeeName_Text ).remove();
                    }
                }
            );
        }

        /**
         * For each child profile information store, create 'attendee-name' from 'first-name' and 'last-name' if 'attendee-name' doesn't exist.    
         */
        function helper_CreateAttendeeNameField() {
            $.each(
                storage_UserProfileChildInfo,
                function () {
                    var name_First      = '';
                    var name_Last       = '';
                    var name_Attendee   = '<no name in child profile>';
                    // Exit is attendee-name exists
                    if ( this.hasOwnProperty( 'attendee-name' ) ) {
                        return;
                    }
                    // Store first name
                    if ( this.hasOwnProperty( 'first-name' ) && this['first-name'] != '' ) {
                        name_Attendee  = this['first-name'];
                    }
                    // Store store name
                    if ( this.hasOwnProperty( 'last-name' ) && this['last-name']  != ''  ) {
                        name_Attendee +=  ' ';
                        name_Attendee +=  this['last-name'];
                    }
                    // Add 'attendee-name' to this child profile.
                    this['attendee-name'] = name_Attendee.trim();
                }
            );
        }

        /**
         * For each child profile information store, create 'attendee-age' from 'd-o-b' if 'attendee-age' doesn't exist.    
         */
        function helper_CreateAttendeeAgeField() {
            $.each(
                storage_UserProfileChildInfo,
                function () {
                    var dob = '';
                    var age = '';
                    // Exit is attendee-age exists
                    if ( this.hasOwnProperty( 'age' ) ) {
                        return;
                    }
                    // Store date of birth
                    if ( this.hasOwnProperty( 'd-o-b' ) && this['d-o-b'] != '' ) {
                        dob = this['d-o-b'];
                    }
                    age = helper_GetAgeFromDateOfBirth( dob );
                    // Add 'attendee-name' to this child profile.
                    this['age'] = age;
                }
            );
        }

        /**
         * Find age from given date of birth.
         * @param dob string    
         */
        function helper_GetAgeFromDateOfBirth( dob ) {
            var difference  = Date.now() - ( new Date( dob ) ).getTime();
            var child_age   = new Date( difference );
            // Replace birth year with age number.
            return ( child_age.getUTCFullYear() - 1970 );
        }


        /* Initialisation: Rockets are go. */

        init();
    } );
} )( window, document, jQuery ) );