exports.handler = async (event, context) => {
    try {
        // We expect date in DD-MM-YYYY format
        const date = event.queryStringParameters.date || new Date().toLocaleDateString('it-IT').replace(/\//g, '-');
        
        const payload = new URLSearchParams({
            'view': 'easycourse',
            'form-type': 'corso',
            'include': 'corso',
            'txtcurr': '1 - Percorso comune',
            'anno': '2026',
            'corso': 'SFM',
            'anno2[]': 'SFMC0001|1',
            'visualizzazione_orario': 'cal',
            'date': date,
            'periodo_didattico': '',
            '_lang': 'it',
            'list': '1',
            'week_grid_type': '-1',
            'ar_codes_': '',
            'ar_select_': '',
            'col_cells': '0',
            'empty_box': '0',
            'only_grid': '0',
            'highlighted_date': '0',
            'all_events': '1',
            'faculty_group': '0'
        });

        const response = await fetch('https://easyacademy.unitn.it/AgendaStudentiUnitn/grid_call.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            body: payload.toString()
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(data)
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: error.message })
        };
    }
};
