define("elg/common", ["jquery", "mdc"], function ($, mdc) {

    return (function () {
        function ElgCommon(readyCallback, afterErrorCallback, qResponse, submitProgress) {
            var this_ = this;
            this.injectedCss = false;
            this.fetchedDataset = false;
            this.serviceInfo = {DatasetRecordUrl: null, Authorization: null};
            this.endpointUrl = null;
            this.samplesFile = null;
            this.afterErrorCallback = afterErrorCallback;
            this.submitProgress = submitProgress;

            // Listen to messages from parent window
            window.addEventListener('message', function (e) {
                if ((window.location.origin === e.origin) && e.data != '') {
                    this_.serviceInfo = JSON.parse(e.data);
                    if (!this_.injectedCss) {
                        // inject CSS
                        var elgCss = $('<link type="text/css" rel="stylesheet" media="screen,print">');
                        elgCss.attr('href', this_.serviceInfo.StyleCss);
                        $('head').append(elgCss);
                        this_.injectedCss = true;
                    }
                    if (!this_.fetchedDataset) {
                        this_.fetchDataset(readyCallback, qResponse);
                    }
                }
            });
            // and tell the parent we're ready for a message
            setTimeout(function () {
                window.parent.postMessage('"GUI:Ready for config"', window.location.origin);
            }, 500);
        }

        ElgCommon.prototype.withAuthSettings = function (obj) {
            if (this.serviceInfo.Authorization) {
                obj.xhrFields = {withCredentials: true};
                obj.headers = {Authorization: this.serviceInfo.Authorization};
            }
            return obj;
        };

        ElgCommon.prototype.fetchRepoMeta = function (metaFile) {
            var samples = [];
            var name = null;
            var description = null;
            var parser = new DOMParser();
            var newDoc = parser.parseFromString(metaFile, "text/html");
            var samplesDoc = $(newDoc);
            samplesDoc.find(".coreon-sample-query").each(function(i, elt) {
                var s = $(elt);
                samples.push({
                    title: s.find(".query-title").text().trim(),
                    query: s.find("pre").text().trim(),
                    htmlClass: 'js-sample_'+i
                })
            });
            var nameNode = samplesDoc.find(".coreon-repo-name");
            var descriptionNode = samplesDoc.find(".coreon-repo-description");
            name = $(nameNode).text();
            description = $(descriptionNode).text();

            var meta = {
                name: name,
                description: description,
                samples: samples
            }
            return meta;
        }

        ElgCommon.prototype.renderRepoMeta = function (meta, qResponse) {
            var this_ = this;
            var samples = meta.samples;
            var name = meta.name;
            var description = meta.description;

            if (name) {
                $('.js-repo-name').text(name);
            }

            if (description) {
                $('.js-repo-description').text(description);
            }

            if (samples.length > 0) {
                $(".js-samples").removeClass("hidden");
                samples.map(function(s, i) {
                    var button = $("<button class=\"mdc-button mdc-button--raised next secondary "+s.htmlClass+"\">"+ s.title +"</button>");
                    $(".js-samples").append(button);
                    $("."+ s.htmlClass).on('click', function (e) {
                    e.preventDefault();
                    // disable the button until the REST call returns
                    $('#query').focus();
                    $('#query').val(s.query);
                    $('#submit-form').prop('disabled', true);
                    $('#query-results').empty();
                    $('#elg-messages').empty();
                    this_.doQuery(s.query, qResponse);
                    return false;
                });
                })
            }

        }

        ElgCommon.prototype.fetchDataset = function (readyCallback, qResponse) {
            var this_ = this;
            if (this_.serviceInfo.DatasetRecordUrl) {
                $.get(this_.withAuthSettings({
                    url: this_.serviceInfo.DatasetRecordUrl,
                    success: function (metadata, textStatus) {
                        if (metadata.described_entity &&
                            metadata.described_entity.lr_subclass &&
                            metadata.described_entity.lr_subclass.dataset_distribution &&
                            metadata.described_entity.lr_subclass.dataset_distribution.length) {
                                var distro = metadata.described_entity.lr_subclass.dataset_distribution[0];
                                this_.endpointUrl = distro.access_location;
                                this_.samplesFile = distro.samples_location[0];
                        }
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        $('#elg-messages')
                          .append($('<div class="alert alert-error"></div>')
                            .text("Failed to fetch resource details"))
                          .css('display', 'block');
                    },
                    complete: function () {
                        if (this_.samplesFile) {
                            $.ajax({
                                url: this_.samplesFile,
                                success: function(data) {
                                    var meta = this_.fetchRepoMeta(data);
                                    this_.renderRepoMeta(meta, qResponse);
                                },
                                error: function (jqXHR, textStatus, errorThrown) {
                                    console.log('Failed to fetch repository meta file');
                                },
                                complete: function () {
                                    readyCallback();
                                }
                            });
                        }

                        readyCallback();
                    }
                }));
            } else {
                // can't fetch parameter info, so we're ready now
                readyCallback();
            }
            this.fetchedDataset = true;
        };

        ElgCommon.prototype.ajaxErrorHandler = function () {
            var this_ = this;
            return function (jqXHR, textStatus, errorThrown) {
                var errors = [];
                var responseJSON = jqXHR.responseJSON;
                var msgsContainer = $('#elg-messages');
                if (this_.submitProgress) {
                    this_.submitProgress.close();
                }
                // this should be i18n'd too really
                console.log(jqXHR.responseText);
                msgsContainer.append($('<div class="alert alert-warning">Unknown error occurred</div>'));
                this_.afterErrorCallback();
            }
        };


        ElgCommon.prototype.doQuery = function (query, responseHandler) {
            var errorHandler = this.ajaxErrorHandler();
            var submitProgress = this.submitProgress;
            var this_ = this;

            $('#process-state').text('Processing');
            if (submitProgress) {
                submitProgress.open();
                submitProgress.determinate = false;
                submitProgress.progress = 0;
            }
            var targetUrl = this_.endpointUrl;
            if(targetUrl) {
                $.get(this_.withAuthSettings({
                    method: "GET",
                    url: targetUrl,
                    data: {query: query},
                    dataType: "json",
                    success: function (respData, textStatus) {
                        if (submitProgress) {
                            submitProgress.close();
                        }
                        $('#process-state').text('');
                        // sync response, handle it now
                        responseHandler(respData);
                        return false;
                    },

                    error: errorHandler,
                }));
            } else {
                console.log("No endpoint URL");
            }
        };

        return ElgCommon;
    })();
});
