define("elg/common", ["jquery", "mdc"], function ($, mdc) {

    return (function () {
        function ElgCommon(readyCallback, afterErrorCallback, submitProgress) {
            var this_ = this;
            this.injectedCss = false;
            this.fetchedDataset = false;
            this.serviceInfo = {DatasetRecordUrl: null, Authorization: null};
            this.endpointUrl = null;
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
            // var targetUrl = this_.endpointUrl;
            var targetUrl = "https://r00-06.coreon.com/sparql.json";
            if(targetUrl) {
                $.get(this_.withAuthSettings({
                    method: "GET",
                    url: targetUrl,
                    data: {query: query},
                    dataType: "json",
                    headers: {
                        "Content-Type": 'application/json',
                        "Accept": "application/json",
                        "X-Core-ApiKey": "VhlkabKlafp3XpyQx-QbeC5vN1KOnuby3ujC3CvV8HqpgJ"
                    },
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
