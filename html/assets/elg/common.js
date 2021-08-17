define("elg/common", ["jquery", "mdc"], function ($, mdc) {

    return (function () {
        function ElgCommon(readyCallback, afterErrorCallback, submitProgress) {
            var this_ = this;
            this.injectedCss = false;
            this.fetchedDataset = false;
            this.serviceInfo = {DatasetRecordUrl: null, Authorization: null};
            this.endpointUrl = null;
            this.samplesFile = null;
            this.samples = [];
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
                        this_.fetchDataset(readyCallback);
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

        ElgCommon.prototype.renderRepoMeta = function (metaFile) {
            var parser = new DOMParser();
            var newDoc = parser.parseFromString(metaFile, "text/html");
            console.log('renderRepoMeta says: starting')
            console.log('renderRepoMeta says: metaFile', metaFile)
            var this_ = this;
            var samplesDoc = $($.parseHTML(metaFile));
            samplesDoc.find(".coreon-sample-query").each(function(i, elt) {
                var s = $(elt);
                this_.samples.push({
                    'title': s.find(".query-title").text().trim(),
                    'query': s.find("pre").text().trim(),
                    'htmlClass': 'js-sample_'+i
                })
            });

            console.log('renderRepoMeta says: samplesDoc', newDoc)
            console.log('renderRepoMeta says: queries', newDoc.find(".coreon-sample-query"))
            if (this_.samples.length > 0) {
                $(".js-samples").removeClass("hidden");
                this_.samples.each(function(i, elt) {
                    var s = $(elt);
                    var button = $("<button class=\"mdc-button mdc-button--raised next secondary "+s.htmlClass+"\">s.title</button>");
                    $(".js-samples-heading").append(button);
                })
            }

        }

        ElgCommon.prototype.fetchDataset = function (readyCallback) {
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
                                $.ajax({ url: this_.samplesFile, success: function(data) {
                                    console.log(data);
                                    this_.renderRepoMeta(data);
                                } });

                        }
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        $('#elg-messages')
                          .append($('<div class="alert alert-error"></div>')
                            .text("Failed to fetch resource details"))
                          .css('display', 'block');
                    },
                    complete: function () {
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
