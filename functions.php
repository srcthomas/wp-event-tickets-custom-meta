<?php

/***************************************************************************************************
                    Scripts / Styles
***************************************************************************************************/

add_action( 'wp_enqueue_scripts', 'srct_register_enqueue_custom_scripts' );
/**
 * Add custom scripts.
 */
function srct_register_enqueue_custom_scripts() {

    // Register scripts
    wp_register_script( 'srct-custom-script', get_stylesheet_directory_uri() . '/js/srct-custom.js', array( 'jquery' ), false, true  );

    // Enqueue scripts
    wp_enqueue_script( 'srct-custom-script' );

    // Enqueue only for/on event pages.
    if ( srct_is_page_event_ticket() && ! is_cart() && ! is_checkout() ) {
        wp_register_script( 'event-tickets', get_stylesheet_directory_uri() . '/js/event-tickets.js', array( 'jquery' ), false );
        wp_enqueue_script(  'event-tickets' );
    }
}

/***************************************************************************************************
                    Event Calendar Exports
***************************************************************************************************/

/**
* Customise columns for Tribe Events Event Attendee CSV export
*/
function srct_csv_export_add_extra_column_headers( $columns ) {

    // Remove columns from export, if possible.
    foreach ( [
        'primary_information',
        'attendee-medical-condition-information',
        'attendee-special-requirement-information',
        'customer_name',
        'customer_email_address'
    ] as $index ) {
        unset( $columns[$index] );
    }

    // Add additional columns to spreadsheet, if possible.
    return array_merge (
        $columns,
        array(
            'ticket_name'                           => 'Ticket Name',
            'attendee-school'                       => 'Attendee School',
            'attendee-first-name'                   => 'Attendee First Name',
            'attendee-last-name'                    => 'Attendee Last Name',
            'attendee-d-o-b'                        => 'Attendee D.O.B',
            'attendee-gender'                       => 'Attendee Gender',
            'attendee-ethnicity'                    => 'Attendee Ethnicity',
            'attendee-medical-condition-info'       => 'Attendee Medical Condition Info',
            'attendee-special-requirements-info'    => 'Attendee Special Requirements Info',
            'attendee-photo-permission'             => 'Attendee Photo Permission',
            'parent-first-name'                     => 'Parent First Name',
            'parent-last-name'                      => 'Parent Last Name',
            'parent-phone'                          => 'Parent Phone',
            'parent-email'                          => 'Parent Email',
            'emergency-1-name'                      => 'Emergency 1 Name',
            'emergency-1-relationship'              => 'Emergency 1 Relationship',
            'emergency-1-phone'                     => 'Emergency 1 Phone',
            'emergency-2-name'                      => 'Emergency 2 Name',
            'emergency-2-relationship'              => 'Emergency 2 Relationship',
            'emergency-2-phone'                     => 'Emergency 2 Phone',
            'alternative-1-name'                    => 'Alternative 1 Name',
            'alternative-1-phone'                   => 'Alternative 1 Phone',
            'alternative-2-name'                    => 'Alternative 2 Name',
            'alternative-2-phone'                   => 'Alternative 2 Phone',
        )
    );
}

/**
* Add additional information to Tribe Events Event Attendee CSV export
*/
function srct_csv_export_populate_extra_columns( $existing, $item, $column ) {

    // Exit if order deleted
    if ( ! $item['order_status'] ) {
        return $existing;
    }

    $cell_data        = $existing;
    $order            = new WC_Order( $item['order_id'] );
    $user_id          = $order->user_id;
    $attendeeName     = $item['attendee_meta']['attendee-name']['value'];
    $xprofile_data    = srct_get_user_xprofile_data( $user_id );
    $child_data       = $xprofile_data['children'];
    $emergency_data   = $xprofile_data['emergency'];
    $alternative_data = $xprofile_data['alternative'];

    // $data['key'] method throws a 500 error so need to hard code the attributes then access via $data->$key
    $ticketName                             = 'ticket_name';
    $attendeeSchool                         = 'school';
    $attendeeFirstName                      = 'first-name';
    $attendeeLastName                       = 'last-name';
    $attendeeDOB                            = 'd-o-b';
    $attendeeGender                         = 'gender';
    $attendeeEthnicity                      = 'ethnicity';
    $attendeeMedicalConditionInformation    = 'medical-condition-information';
    $attendeeSpecialRequirementInformation  = 'special-requirement-information';
    $attendeePhotoPermission                = 'photo-permission';
    $emergency1Name                         = 'ec1-name';
    $emergency1Relationship                 = 'ec1-relationship';
    $emergency1Phone                        = 'ec1-phone';
    $emergency2Name                         = 'ec2-name';
    $emergency2Relationship                 = 'ec2-relationship';
    $emergency2Phone                        = 'ec2-phone';
    $alternative1Name                       = 'apu1-name';
    $alternative1Phone                      = 'apu1-phone';
    $alternative2Name                       = 'apu2-name';
    $alternative2Phone                      = 'apu2-phone';

    switch ( $column ) {

        case 'ticket-name' :
            if ( strpos( $attendeeName, $data->$attendeeFirstName ) === 0 ) { // if attendee name starts with first name
                $cell_data = 'test';
                if ( isset( $item->$ticketName ) ) {
                    $cell_data = $item->$ticketName;
                }
            }
            break;

        case 'attendee-school' :
            foreach ( $child_data as $data ) {
                if ( strpos( $attendeeName, $data->$attendeeFirstName ) === 0 ) { // if attendee name starts with first name
                    if ( isset( $data->$attendeeSchool ) ) {
                        $cell_data = $data->$attendeeSchool;
                    }
                }
            }
            break;

        case 'attendee-first-name' :
            foreach ( $child_data as $data ) {
                if ( strpos( $attendeeName, $data->$attendeeFirstName ) === 0 ) { // if attendee name starts with first name
                    if ( isset( $data->$attendeeFirstName ) ) {
                        $cell_data = $data->$attendeeFirstName;
                    }
                }
            }
            break;

        case 'attendee-last-name' :
            foreach ( $child_data as $data ) {
                if ( strpos( $attendeeName, $data->$attendeeFirstName ) === 0 ) { // if attendee name starts with first name
                    if ( isset( $data->$attendeeLastName ) ) {
                        $cell_data = $data->$attendeeLastName;
                    }
                }
            }
            break;

        case 'attendee-d-o-b' :
            foreach ( $child_data as $data ) {
                if ( strpos( $attendeeName, $data->$attendeeFirstName ) === 0 ) { // if attendee name starts with first name
                    if ( isset( $data->$attendeeDOB ) ) {
                        $cell_data = $data->$attendeeDOB;
                    }
                }
            }
            break;

        case 'attendee-gender' :
            foreach ( $child_data as $data ) {
                if ( strpos( $attendeeName, $data->$attendeeFirstName ) === 0 ) { // if attendee name starts with first name
                    if ( isset( $data->$attendeeGender ) ) {
                        $cell_data = $data->$attendeeGender;
                    }
                }
            }
            break;

        case 'attendee-ethnicity' :
            foreach ( $child_data as $data ) {
                if ( strpos( $attendeeName, $data->$attendeeFirstName ) === 0 ) { // if attendee name starts with first name
                    if ( isset( $data->$attendeeEthnicity ) ) {
                        $cell_data = $data->$attendeeEthnicity;
                    }
                }
            }
            break;

        case 'attendee-medical-condition-info' :
            foreach ( $child_data as $data ) {
                if ( strpos( $attendeeName, $data->$attendeeFirstName ) === 0 ) { // if attendee name starts with first name
                    if ( isset( $data->$attendeeMedicalConditionInformation ) ) {
                        if ( $data->$attendeeMedicalConditionInformation == '' ) {
                            $cell_data = 'N/A';
                        } else {
                            $cell_data = $data->$attendeeMedicalConditionInformation;
                        }
                    }
                }
            }
            break;

        case 'attendee-special-requirements-info' :
            foreach ( $child_data as $data ) {
                if ( strpos( $attendeeName, $data->$attendeeFirstName ) === 0 ) { // if attendee name starts with first name
                    if ( isset( $data->$attendeeSpecialRequirementInformation ) ) {
                        if ( $data->$attendeeSpecialRequirementInformation == '' ) {
                            $cell_data = 'N/A';
                        } else {
                            $cell_data = $data->$attendeeSpecialRequirementInformation;
                        }
                    }
                }
            }
            break;

        case 'attendee-photo-permission' :
            foreach ( $child_data as $data ) {
                if ( strpos( $attendeeName, $data->$attendeeFirstName ) === 0 ) { // if attendee name starts with first name
                    if ( isset( $data->$attendeePhotoPermission ) ) {
                        $cell_data = $data->$attendeePhotoPermission;
                    }
                }
            }
            break;

        case 'parent-first-name' :
            $cell_data = get_post_meta( $item['order_id'], '_billing_first_name', true );
            break;

        case 'parent-last-name' :
            $cell_data = get_post_meta( $item['order_id'], '_billing_last_name', true );
            break;

        case 'parent-phone' :
            $cell_data = '_ ' . get_post_meta( $item['order_id'], '_billing_phone', true );
            break;

        case 'parent-email' :
            $cell_data = get_post_meta( $item['order_id'], '_billing_email', true );
            break;

        case 'emergency-1-name' :
            foreach ( $emergency_data[0] as $key => $val ) {
                if ( strpos( $key, 'name' ) ) {
                    $cell_data = $val;
                }
            }
            break;

        case 'emergency-1-relationship' :
            foreach ( $emergency_data[0] as $key => $val ) {
                if ( strpos( $key, 'relationship' ) ) {
                    $cell_data = $val;
                }
            }
            break;

        case 'emergency-1-phone' :
            foreach ( $emergency_data[0] as $key => $val ) {
                if ( strpos( $key, 'phone' ) ) {
                    $cell_data = '_ ' . $val;
                }
            }
            break;

        case 'emergency-2-name' :
            foreach ( $emergency_data[1] as $key => $val ) {
                if ( strpos( $key, 'name' ) ) {
                    $cell_data = $val;
                }
            }
            break;

        case 'emergency-2-relationship' :
            foreach ( $emergency_data[1] as $key => $val ) {
                if ( strpos( $key, 'relationship' ) ) {
                    $cell_data = $val;
                }
            }
            break;

        case 'emergency-2-phone' :
            foreach ( $emergency_data[1] as $key => $val ) {
                if ( strpos( $key, 'phone' ) ) {
                    $cell_data = '_ ' . $val;
                }
            }
            break;

        case 'alternative-1-name' :
            foreach ( $alternative_data[0] as $key => $val ) {
                if ( strpos( $key, 'name' ) ) {
                    $cell_data = $val;
                }
            }
            break;

        case 'alternative-1-phone' :
            foreach ( $alternative_data[0] as $key => $val ) {
                if ( strpos( $key, 'phone' ) ) {
                    $cell_data = '_ ' . $val;
                }
            }
            break;

        case 'alternative-2-name' :
            foreach ( $alternative_data[1] as $key => $val ) {
                if ( strpos( $key, 'name' ) ) {
                    $cell_data = $val;
                }
            }
            break;

        case 'alternative-2-phone' :
            foreach ( $alternative_data[1] as $key => $val ) {
                if ( strpos( $key, 'phone' ) ) {
                    $cell_data = '_ ' . $val;
                }
            }
            break;
    }

    return $cell_data;
}

/***************************************************************************************************
                    Event Calendar
***************************************************************************************************/

add_action( 'woocommerce_order_item_meta_end', 'srct_add_ticket_meta_to_wc_order', 10, 3 );
/**
 * Add ticket meta data to order email.
 */
function srct_add_ticket_meta_to_wc_order( $item_id, $item, $order, $plain_text ) {

    $order_meta = get_post_meta( $order->id );
    $product_id = $order->get_item( $item_id )['product_id'];

    if ( array_key_exists( '_tribe_tickets_meta', $order_meta ) ) {

        $tribe_tickets_meta = unserialize( $order_meta['_tribe_tickets_meta'][0] );

        // Loop through all meta data and add it to the order.
        foreach ( $tribe_tickets_meta as $ticket_id => $tickets_meta ) {
            if ( $product_id !== $ticket_id ) {
                continue;
            }

            $tickets_meta = array_unique( $tickets_meta, SORT_REGULAR );

            echo '<table class="order-ticket-meta-container">';
            echo '<th class="order-ticket-meta">Ticket ID</th><th class="order-ticket-meta">' . $ticket_id . '</th>';
            foreach ( $tickets_meta as $ticket_meta ) {
                echo '<tr>';
                echo '<td colspan="2" class="order-ticket-meta" style="background-color:#eee;height:1px;max-height:1px;padding:0;"></td>';
                echo '</tr>';
                foreach ( $ticket_meta as $ticket_meta_field => $ticket_meta_value ) {
                    echo '<tr>';
                    echo '<td class="order-ticket-meta" style="border:0;">' . srct_filter_ticket_meta_data_key_field( $ticket_meta_field ) . ':</td><td class="order-ticket-meta" style="border:0;">' . $ticket_meta_value . '</td>';
                    echo '</tr>';
                }
            }
            echo '</table>';
        }
    }
}

add_filter( 'woocommerce_cart_item_name', 'srct_filter_woocommerce_cart_item_name', 10, 3 );
/**
 * define the woocommerce_cart_item_name callback
 */
function srct_filter_woocommerce_cart_item_name( $array, $cart_item, $cart_item_key ) {
    // $items = WC_CART::get_cart_for_session();
    $array .= '<br>' . var_dump($items);
    // $array .= '<br>' . var_dump( $cart_item );
    if ( isset( $_POST['tribe-tickets-meta'][$product_id] ) ) {
        foreach( $_POST['tribe-tickets-meta'][$product_id] as $attendee_metadata ) {
            $array .= '<div class="tribe-tickets-meta-container">';
            foreach( $attendee_metadata as $attendee_name => $attendee_value ) {
                // Format attendee name
                $attendee_name = srct_filter_ticket_meta_data_key_field( $attendee_name );
                // Display name and value
                $array .= '<span class="tribe-ticket-meta-name">'  . $attendee_name  . ':</span>';
                $array .= '<span class="tribe-ticket-meta-value">' . $attendee_value . '</span><br>';
            }
            $array .= '</div>';
        }
    }
    return $array;
}

/**
 * Strip and format key field
 * @return $key string Formatted value
 */
function srct_filter_ticket_meta_data_key_field( $key ) {
    // Remove and replace
    foreach ( [
        'attendee' =>   '',
        '_yes' =>       '',
        '_no' =>        '',
        '_' =>          '',
        '-' =>          ' '
    ] as $str_to_find => $str_to_replace ) {
        $key = str_replace( $str_to_find, $str_to_replace, $key );
    }
    // Trim and uppercase
    $key = ucfirst( trim( $key ) );
    // Return
    return $key;
}

/**
 * Get extended profile data for given user.
 */
function srct_get_user_xprofile_data( $user_id ) {

    $user_xprofile_data = [];

    if ( bp_has_profile( 'user_id=' . $user_id ) ) {

        while ( bp_profile_groups() ) {

            bp_the_profile_group();

            // Need to attain fields from profile to populate into array
            if ( bp_profile_group_has_fields() ) {

                $profile_group_name = bp_get_the_profile_group_name();
                $group_name = '';

                // Store chlildren & emergency contact information
                if ( preg_match( '/^Child/', $profile_group_name ) ) {
                    $group_name = 'children';
                } else if ( ( preg_match( '/^Emergency/', $profile_group_name ) ) ) {
                    $group_name = 'emergency';
                } else if ( ( preg_match( '/^Alternative/', $profile_group_name ) ) ) {
                    $group_name = 'alternative';
                } else {
                    continue;
                }

                // Store this attendees information.
                $group_data = '';

                while ( bp_profile_fields() ) {

                    bp_the_profile_field();

                    // Text sanitisation
                    $field_name   = filter_var( bp_get_the_profile_field_name(),  FILTER_SANITIZE_STRING );
                    $field_value  = filter_var( bp_get_the_profile_field_value(), FILTER_SANITIZE_STRING );
                    // Remove group number prefix and trailing new line chars.
                    $namePattern  = '/[A-Z]\d\s-\s|[?]/';
                    $valuePattern = '/\\n/';
                    // Base format field names and values.
                    $field_name   = preg_replace( $namePattern,  '', $field_name  );
                    $field_value  = preg_replace( $valuePattern, '', $field_value );
                    // All chars to lowercase
                    $field_name   = strtolower( $field_name );
                    // Space to dashes
                    $field_name   = preg_replace( '/\s|\./', '-', $field_name );
                    // Add current profile field info to this attendees info.
                    $group_data->{$field_name} = $field_value;
                }
                // Add current group info to master information store.
                $user_xprofile_data[$group_name][] = $group_data;
            }
        }
    }

    return $user_xprofile_data;
}

add_filter( 'wp_head', 'srct_populate_ticket_dropdown_info', 10 );
/**
 * Get current current user child information to populate ticket fields.
 */
function srct_populate_ticket_dropdown_info() {

    if ( ! srct_is_page_event_ticket() || ! is_user_logged_in() ) {
        return;
    }

    $user_child_profile_information = [];

    if ( bp_has_profile( 'user_id=' . bp_loggedin_user_id() ) ) {

        while ( bp_profile_groups() ) {

            bp_the_profile_group();

            // Need to attain fields from profile to populate into array
            if ( bp_profile_group_has_fields() ) {

                $group_name = bp_get_the_profile_group_name();
                // Only store chlildrens information
                if ( preg_match( '/^Child/', $group_name ) ) {

                    // Store this attendees information.
                    $attendee = '';

                    while ( bp_profile_fields() ) {

                        bp_the_profile_field();

                        // Text sanitisation
                        $field_name   = filter_var( bp_get_the_profile_field_name(),  FILTER_SANITIZE_STRING );
                        $field_value  = filter_var( bp_get_the_profile_field_value(), FILTER_SANITIZE_STRING );
                        // Remove group number prefix and trailing new line chars.
                        $namePattern  = '/[A-Z]\d\s-\s|[?]/';
                        $valuePattern = '/\\n/';
                        // Base format field names and values.
                        $field_name   = preg_replace( $namePattern,  '', $field_name  );
                        $field_value  = preg_replace( $valuePattern, '', $field_value );
                        // All chars to lowercase
                        $field_name   = strtolower( $field_name );
                        // Space to dashes
                        $field_name   = preg_replace( '/\s|\./', '-', $field_name );
                        // Add current profile field info to this attendees info.
                        $attendee->{$field_name} = $field_value;
                    }
                    // Add current attendee info to master information store.
                    $user_child_profile_information[] = $attendee;
                }
            }
        }
    }
    // JSONify all attendees and make available for JS.
    echo '<script>window.storage_UserProfileChildInfo = ' . json_encode( $user_child_profile_information ) . '</script>';
}