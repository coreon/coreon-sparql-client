// fix up directionality for the test form and annotation result section, e.g. if this
// gui is being used for Arabic NER then the form and the result should be rendered as RTL
(function() {
    var myUrl = new URL(window.location.href);
    if(myUrl.searchParams.has('dir')) {
        document.getElementById('elg-test-form').dir = myUrl.searchParams.get('dir');
        document.getElementById('elg-annotate-result').dir = myUrl.searchParams.get('dir');
    }
})();

require(["jquery", "mdc", "elg/common"], function ($, mdc, ElgCommon) {
    $(function () {
        mdc.autoInit();

        function enableSubmit() {
            $('#submit-form').prop('disabled', false);
        }

        var elgCommon = new ElgCommon(enableSubmit, enableSubmit,
          document.getElementById('submitprogress').MDCLinearProgress);

        $('#test-again').on('click', function(e) {
            e.preventDefault();
            $('#elg-annotate-result').addClass('hidden');
        });

        function handleResponse(data) {
            if (data.head
              && data.head.vars
              && data.head.vars.length > 0) {
                $('#elg-annotate-result').removeClass('hidden');

                // re-enable the button
                $('#submit-form').prop('disabled', false);

                // do stuff with results
                var cols = data.head.vars;
                var tbl = $('<table class="q-results"></table>');
                var heading = $('<tr></tr>').appendTo($('<thead class="header"></thead>').appendTo(tbl));
                heading.append($('<td colspan="'+ cols.length +'"></td>').text('Sparql Query Results'));
                var headRow = $('<tr></tr>').appendTo($('<thead></thead>').appendTo(tbl));
                for(var i = 0; i < cols.length; i++) {
                    headRow.append($('<td></td>').text(cols[i]));
                }

                var body = $('<tbody></tbody>').appendTo(tbl);
                if(data.results && data.results.bindings && data.results.bindings.length > 0) {
                    hits = data.results.bindings;
                    for(i = 0; i < hits.length; i++) {
                        var row = $('<tr></tr>').appendTo(body);
                        for (var j = 0; j < cols.length; j++) {
                            var varVal = hits[i][cols[j]];
                            if(varVal) {
                                varVal = varVal.value;
                            } else {
                                varVal = '\u00A0';
                            }
                            $('<td class="col-'+cols[j]+'"></td>').text(varVal).appendTo(row);
                        }
                    }
                } else {
                    body.append($('<tr><td colspan=' + cols.length + '>No results</td></tr>'));
                }

                $('#query-results').append(tbl);
            } else {
                var msgsContainer = $('#elg-messages');
                msgsContainer.append($('<div class="alert alert-warning">Malformed SPARQL results</div>'));
            }
        }

        $("#submit-form").on('click', function (e) {
            e.preventDefault();
            var query = $('#query').val();
            // disable the button until the REST call returns
            $('#submit-form').prop('disabled', true);
            $('#query-results').empty();
            $('#elg-messages').empty();

            elgCommon.doQuery(query, handleResponse);
            return false;
        });

        $(".js-sample_1").on('click', function (e) {
            e.preventDefault();
            var query = 'SELECT *\n' +
              'WHERE {\n' +
              '    ?t rdf:type coreon:Term .\n' +
              '    ?t coreon:value ?val .\n' +
              '}\n' +
              'LIMIT 10';

            // disable the button until the REST call returns
            $('#query').focus();
            $('#query').val(query);
            $('#submit-form').prop('disabled', true);
            $('#query-results').empty();
            $('#elg-messages').empty();

            elgCommon.doQuery(query, handleResponse);
            return false;
        });

        $(".js-sample_2").on('click', function (e) {
            e.preventDefault();
            var query = 'SELECT*\n' +
              'WHERE { \n' +
              '    ?t rdf:type coreon:Term . \n' +
              '    ?t coreon:value ?val . \n' +
              '    FILTER langMatches( lang(?val), "en" )  \n' +
              '} \n' +
              'ORDER BY ASC(?val) \n' +
              'LIMIT 50';

            // disable the button until the REST call returns
            $('#query').focus();
            $('#query').val(query);
            $('#submit-form').prop('disabled', true);
            $('#query-results').empty();
            $('#elg-messages').empty();

            elgCommon.doQuery(query, handleResponse);
            return false;
        });


    });
});


