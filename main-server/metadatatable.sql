USE photoapp;

DROP TABLE IF EXISTS metadata;

CREATE TABLE metadata
(
    assetid         int not null,
    longitude       varchar(128) not null,
    latitude        varchar(64) not null,
    datecreated     varchar(64) not null,
    PRIMARY KEY (assetid)
);